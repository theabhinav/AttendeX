/**
 * Google Classroom API Service
 * Handles OAuth2 authorization, token management, and Classroom REST API queries
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

/**
 * Generate Google OAuth2 Authorization URL
 * @param {string} state - Typically the user ID or a signed token
 */
export const getAuthorizationUrl = (state) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CLASSROOM_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Google OAuth credentials not configured in environment variables');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: CLASSROOM_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: state || '',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 * @param {string} code 
 * @param {string} [customRedirectUri]
 */
export const exchangeCodeForTokens = async (code, customRedirectUri) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = customRedirectUri || process.env.GOOGLE_CLASSROOM_REDIRECT_URI;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code for tokens');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    expiryDate: Date.now() + (data.expires_in || 3600) * 1000,
    scope: data.scope,
    tokenType: data.token_type,
  };
};

/**
 * Refresh an expired access token using the refresh token
 * @param {string} refreshToken 
 */
export const refreshAccessToken = async (refreshToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Failed to refresh access token');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    expiryDate: Date.now() + (data.expires_in || 3600) * 1000,
  };
};

/**
 * Get valid access token for user, refreshing if expired
 * @param {Object} user 
 */
export const getValidTokenForUser = async (user) => {
  if (!user.googleClassroom?.isConnected) {
    throw new Error('Google Classroom is not connected for this account');
  }

  const { accessToken, refreshToken, expiryDate } = user.googleClassroom;

  // If token is still valid (with 60-second buffer), return it
  if (accessToken && expiryDate && Date.now() < (expiryDate - 60000)) {
    return accessToken;
  }

  // Token is expired, refresh it
  if (!refreshToken) {
    throw new Error('No refresh token available. Please reconnect Google Classroom.');
  }

  const refreshed = await refreshAccessToken(refreshToken);
  user.googleClassroom.accessToken = refreshed.accessToken;
  user.googleClassroom.expiryDate = refreshed.expiryDate;
  await user.save();

  return refreshed.accessToken;
};

/**
 * Fetch Google User Info (profile, email)
 * @param {string} accessToken 
 */
export const fetchGoogleUserInfo = async (accessToken) => {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }

  return await res.json();
};

/**
 * Fetch all active courses for student
 * @param {string} accessToken 
 */
export const fetchCourses = async (accessToken) => {
  const res = await fetch(`${CLASSROOM_API_BASE}/courses?courseStates=ACTIVE`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch courses: ${error}`);
  }

  const data = await res.json();
  return data.courses || [];
};

/**
 * Fetch coursework (assignments) for a specific course
 * @param {string} accessToken 
 * @param {string} courseId 
 */
export const fetchCourseWork = async (accessToken, courseId) => {
  const res = await fetch(`${CLASSROOM_API_BASE}/courses/${encodeURIComponent(courseId)}/courseWork`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    // If course has no coursework or permissions restricted, return empty array gracefully
    return [];
  }

  const data = await res.json();
  return data.courseWork || [];
};

/**
 * Fetch student submission status for a specific coursework item
 * @param {string} accessToken 
 * @param {string} courseId 
 * @param {string} courseWorkId 
 */
export const fetchStudentSubmission = async (accessToken, courseId, courseWorkId) => {
  try {
    const res = await fetch(
      `${CLASSROOM_API_BASE}/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions?userId=me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.studentSubmissions?.[0] || null;
  } catch (err) {
    return null;
  }
};

/**
 * Upload a local file directly into Student's Google Drive
 * @param {string} accessToken
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} mimeType
 */
export const uploadFileToDrive = async (accessToken, fileBuffer, fileName, mimeType = 'application/octet-stream') => {
  const boundary = '-------AttendXDriveUploadBoundary' + Date.now();
  const metadata = JSON.stringify({
    name: fileName,
    description: 'Assignment submission uploaded via AttendX Academic Assistant',
  });

  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody = Buffer.concat([
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': multipartRequestBody.length.toString(),
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive upload failed: ${errorText}`);
  }

  return await res.json();
};

/**
 * Attach a Google Drive file or Link to a Student Submission
 * @param {string} accessToken
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 * @param {Object} attachment - { driveFile: { id } } OR { link: { url } }
 */
export const attachToSubmission = async (accessToken, courseId, courseWorkId, submissionId, attachment) => {
  const res = await fetch(
    `${CLASSROOM_API_BASE}/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}:modifyAttachments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addAttachments: [attachment],
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to attach to Google Classroom submission: ${error}`);
  }

  return await res.json();
};

/**
 * Submit / Turn in assignment to Google Classroom
 * @param {string} accessToken
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 */
export const turnInSubmission = async (accessToken, courseId, courseWorkId, submissionId) => {
  const res = await fetch(
    `${CLASSROOM_API_BASE}/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}:turnIn`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to turn in assignment to Google Classroom: ${error}`);
  }

  return await res.json();
};

/**
 * Reclaim / Unsubmit assignment from Google Classroom
 * @param {string} accessToken
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 */
export const reclaimSubmission = async (accessToken, courseId, courseWorkId, submissionId) => {
  const res = await fetch(
    `${CLASSROOM_API_BASE}/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(courseWorkId)}/studentSubmissions/${encodeURIComponent(submissionId)}:reclaim`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to unsubmit (reclaim) assignment: ${error}`);
  }

  return await res.json();
};
