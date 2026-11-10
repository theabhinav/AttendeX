import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Assignment from '../models/Assignment.js';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getValidTokenForUser,
  fetchGoogleUserInfo,
  fetchCourses,
  fetchCourseWork,
  fetchStudentSubmission,
  uploadFileToDrive,
  attachToSubmission,
  turnInSubmission,
  reclaimSubmission,
} from '../services/googleClassroomService.js';

/**
 * @desc    Generate Google Classroom OAuth URL
 * @route   GET /api/classroom/auth-url
 * @access  Private
 */
export const getAuthUrl = async (req, res) => {
  try {
    const authUrl = getAuthorizationUrl(req.user._id.toString());
    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('Error getting Classroom Auth URL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate authorization URL',
    });
  }
};

/**
 * @desc    Direct code exchange endpoint (when frontend handles redirect)
 * @route   POST /api/classroom/exchange-code
 * @access  Private
 */
export const exchangeAuthCode = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    const tokens = await exchangeCodeForTokens(code, redirectUri);
    let googleEmail = '';
    try {
      const userInfo = await fetchGoogleUserInfo(tokens.accessToken);
      googleEmail = userInfo.email || '';
    } catch (e) {
      console.warn('Could not fetch Google user info:', e.message);
    }

    const user = await User.findById(req.user._id);
    user.googleClassroom = {
      isConnected: true,
      email: googleEmail || user.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || user.googleClassroom?.refreshToken || '',
      expiryDate: tokens.expiryDate,
      lastSyncedAt: new Date(),
    };
    await user.save();

    res.json({
      success: true,
      email: googleEmail || user.email,
      message: 'Google Classroom linked successfully',
    });
  } catch (error) {
    console.error('Error exchanging authorization code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to exchange authorization code',
    });
  }
};

/**
 * @desc    Handle Google OAuth callback
 * @route   GET /api/classroom/callback
 * @access  Public (Redirect target from Google)
 */
export const handleOAuthCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const { code, state: userId, error } = req.query;

  if (error) {
    console.error('Google OAuth callback returned error:', error);
    return res.redirect(`${clientUrl}/assignments?classroom_error=${encodeURIComponent(error)}`);
  }

  if (!code || !userId) {
    return res.redirect(`${clientUrl}/assignments?classroom_error=Missing_authorization_code_or_state`);
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${clientUrl}/assignments?classroom_error=User_not_found`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user profile email from Google
    let googleEmail = '';
    try {
      const userInfo = await fetchGoogleUserInfo(tokens.accessToken);
      googleEmail = userInfo.email || '';
    } catch (e) {
      console.warn('Could not fetch Google user info:', e.message);
    }

    // Persist tokens
    user.googleClassroom = {
      isConnected: true,
      email: googleEmail || user.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || user.googleClassroom?.refreshToken || '',
      expiryDate: tokens.expiryDate,
      lastSyncedAt: new Date(),
    };

    await user.save();

    // Redirect to frontend assignments page with success query
    return res.redirect(`${clientUrl}/assignments?classroom_connected=true&email=${encodeURIComponent(googleEmail || user.email)}`);
  } catch (err) {
    console.error('Error during Google OAuth callback exchange:', err);
    return res.redirect(`${clientUrl}/assignments?classroom_error=${encodeURIComponent(err.message)}`);
  }
};

/**
 * @desc    Get Google Classroom connection status
 * @route   GET /api/classroom/status
 * @access  Private
 */
export const getConnectionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('googleClassroom');
    const gc = user?.googleClassroom;

    res.json({
      success: true,
      isConnected: !!gc?.isConnected,
      email: gc?.email || '',
      lastSyncedAt: gc?.lastSyncedAt || null,
    });
  } catch (error) {
    console.error('Error fetching Classroom status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Classroom status',
    });
  }
};

/**
 * @desc    Sync courses and assignments from Google Classroom
 * @route   POST /api/classroom/sync
 * @access  Private
 */
export const syncClassroom = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.googleClassroom?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Google Classroom is not connected. Please connect your Google account first.',
      });
    }

    const accessToken = await getValidTokenForUser(user);

    // 1. Fetch active courses
    const courses = await fetchCourses(accessToken);

    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const course of courses) {
      if (!course.id || !course.name) continue;

      // 2. Ensure a Subject exists in AttendX for this course
      let subject = await Subject.findOne({
        userId: user._id,
        $or: [
          { name: { $regex: new RegExp(`^${course.name.trim()}$`, 'i') } },
          { code: course.section ? course.section.trim() : null },
        ],
      });

      if (!subject) {
        // Create subject for user
        const generatedCode = course.section?.trim() || course.name.substring(0, 6).toUpperCase().replace(/\s+/g, '');
        subject = await Subject.create({
          userId: user._id,
          name: course.name.trim(),
          code: generatedCode,
          minAttendance: user.attendanceThreshold || 75,
        });
      }

      // 3. Fetch CourseWork (assignments) for this course
      const courseWorkList = await fetchCourseWork(accessToken, course.id);

      for (const cw of courseWorkList) {
        if (!cw.id || !cw.title) continue;

        // Due date calculation
        let dueDate = null;
        if (cw.dueDate) {
          const year = cw.dueDate.year;
          const month = (cw.dueDate.month || 1) - 1;
          const day = cw.dueDate.day || 1;
          const hours = cw.dueTime?.hours || 23;
          const minutes = cw.dueTime?.minutes || 59;
          dueDate = new Date(Date.UTC(year, month, day, hours, minutes));
        } else {
          // Default to 7 days from now
          dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        // Submission state
        let status = 'Pending';
        const submission = await fetchStudentSubmission(accessToken, course.id, cw.id);
        if (submission) {
          if (submission.state === 'TURNED_IN' || submission.state === 'RETURNED') {
            status = 'Completed';
          }
        }

        // Determine Priority based on due date
        const daysUntilDue = (dueDate - new Date()) / (1000 * 60 * 60 * 24);
        let priority = 'Medium';
        if (daysUntilDue < 2) {
          priority = 'Urgent';
        } else if (daysUntilDue < 5) {
          priority = 'High';
        } else if (daysUntilDue > 10) {
          priority = 'Low';
        }

        // Upsert assignment
        let assignment = await Assignment.findOne({
          userId: user._id,
          googleClassroomId: cw.id,
        });

        if (assignment) {
          assignment.title = cw.title;
          assignment.description = cw.description || assignment.description;
          assignment.dueDate = dueDate;
          assignment.status = status;
          assignment.submissionLink = cw.alternateLink || assignment.submissionLink;
          assignment.googleCourseId = course.id;
          assignment.googleCourseName = course.name;
          await assignment.save();
          updatedCount++;
        } else {
          await Assignment.create({
            userId: user._id,
            subjectId: subject._id,
            title: cw.title,
            description: cw.description || '',
            dueDate,
            priority,
            status,
            submissionLink: cw.alternateLink || '',
            source: 'google_classroom',
            googleClassroomId: cw.id,
            googleCourseId: course.id,
            googleCourseName: course.name,
          });
          createdCount++;
        }
        syncedCount++;
      }
    }

    user.googleClassroom.lastSyncedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: `Successfully synchronized ${syncedCount} items from ${courses.length} courses.`,
      coursesCount: courses.length,
      syncedCount,
      createdCount,
      updatedCount,
      lastSyncedAt: user.googleClassroom.lastSyncedAt,
    });
  } catch (error) {
    console.error('Error syncing Google Classroom:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to synchronize with Google Classroom',
    });
  }
};

/**
 * @desc    Disconnect Google Classroom
 * @route   POST /api/classroom/disconnect
 * @access  Private
 */
export const disconnectClassroom = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.googleClassroom = {
        isConnected: false,
        email: '',
        accessToken: '',
        refreshToken: '',
        expiryDate: null,
        lastSyncedAt: null,
      };
      await user.save();
    }

    res.json({
      success: true,
      message: 'Google Classroom disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Classroom',
    });
  }
};

/**
 * @desc    Submit / Turn In assignment directly to Google Classroom
 * @route   POST /api/classroom/submit
 * @access  Private
 */
export const submitAssignmentToClassroom = async (req, res) => {
  try {
    const { assignmentId, link } = req.body;
    const file = req.file;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required',
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      userId: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found in your account',
      });
    }

    if (assignment.source !== 'google_classroom' || !assignment.googleClassroomId || !assignment.googleCourseId) {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not linked to a Google Classroom course.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user?.googleClassroom?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Google Classroom is not connected for this account.',
      });
    }

    const accessToken = await getValidTokenForUser(user);

    // 1. Get current submission state from Classroom
    const submission = await fetchStudentSubmission(
      accessToken,
      assignment.googleCourseId,
      assignment.googleClassroomId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Could not find your student submission object for this coursework in Google Classroom.',
      });
    }

    if (submission.state === 'TURNED_IN') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is already turned in. Please unsubmit first if you wish to resubmit attachments.',
      });
    }

    let attachedItems = [];
    let driveFileResult = null;

    // 2. Upload file to Google Drive and attach if provided
    if (file && file.buffer) {
      driveFileResult = await uploadFileToDrive(
        accessToken,
        file.buffer,
        file.originalname || `Assignment_${assignment.title}`,
        file.mimetype || 'application/octet-stream'
      );

      await attachToSubmission(
        accessToken,
        assignment.googleCourseId,
        assignment.googleClassroomId,
        submission.id,
        {
          driveFile: {
            id: driveFileResult.id,
          },
        }
      );
      attachedItems.push({ type: 'driveFile', name: file.originalname, id: driveFileResult.id });
    }

    // 3. Attach link if provided
    if (link && link.trim()) {
      await attachToSubmission(
        accessToken,
        assignment.googleCourseId,
        assignment.googleClassroomId,
        submission.id,
        {
          link: {
            url: link.trim(),
          },
        }
      );
      attachedItems.push({ type: 'link', url: link.trim() });
    }

    // 4. Turn in submission to Google Classroom
    await turnInSubmission(
      accessToken,
      assignment.googleCourseId,
      assignment.googleClassroomId,
      submission.id
    );

    // 5. Update local AttendX assignment state
    assignment.status = 'Completed';
    if (driveFileResult?.webViewLink) {
      assignment.submissionLink = driveFileResult.webViewLink;
    } else if (link?.trim()) {
      assignment.submissionLink = link.trim();
    }
    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment successfully turned in to Google Classroom!',
      submissionState: 'TURNED_IN',
      attachedItems,
      assignment,
    });
  } catch (error) {
    console.error('Error submitting to Classroom:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit assignment to Google Classroom',
    });
  }
};

/**
 * @desc    Unsubmit / Reclaim assignment from Google Classroom
 * @route   POST /api/classroom/unsubmit
 * @access  Private
 */
export const unsubmitAssignmentFromClassroom = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required',
      });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      userId: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const user = await User.findById(req.user._id);
    const accessToken = await getValidTokenForUser(user);

    const submission = await fetchStudentSubmission(
      accessToken,
      assignment.googleCourseId,
      assignment.googleClassroomId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Student submission record not found in Google Classroom.',
      });
    }

    await reclaimSubmission(
      accessToken,
      assignment.googleCourseId,
      assignment.googleClassroomId,
      submission.id
    );

    assignment.status = 'In Progress';
    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment successfully unsubmitted in Google Classroom. You can now edit or upload new files.',
      assignment,
    });
  } catch (error) {
    console.error('Error un-submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unsubmit assignment from Google Classroom',
    });
  }
};

/**
 * @desc    Get detailed submission status and teacher grading
 * @route   GET /api/classroom/submission-details/:assignmentId
 * @access  Private
 */
export const getSubmissionDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      userId: req.user._id,
    });

    if (!assignment || !assignment.googleClassroomId || !assignment.googleCourseId) {
      return res.status(404).json({
        success: false,
        message: 'Google Classroom linked assignment not found',
      });
    }

    const user = await User.findById(req.user._id);
    const accessToken = await getValidTokenForUser(user);

    const submission = await fetchStudentSubmission(
      accessToken,
      assignment.googleCourseId,
      assignment.googleClassroomId
    );

    res.json({
      success: true,
      submission,
      assignment,
    });
  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submission details',
    });
  }
};
