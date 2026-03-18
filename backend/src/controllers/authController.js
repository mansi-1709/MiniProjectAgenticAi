import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// @desc    Register new user (Admin/Pharmacist self-registration)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Only allow admin and pharmacist self-registration
    // Super admin must be created via seed script
    if (role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot self-register as super admin. Please contact system administrator.',
      });
    }

    // Validate role
    if (!['admin', 'pharmacist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Choose admin (doctor) or pharmacist.',
      });
    }

    // Create user (will be in 'pending' status)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
    });

    const roleLabel = role === 'admin' ? 'doctor/admin' : 'pharmacist';

    res.status(201).json({
      success: true,
      message: `Registration successful! Your ${roleLabel} account is pending approval.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait or contact administrator.',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been rejected. Please contact administrator.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

    const message = `
      You requested a password reset. Please click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you did not request this, please ignore this email.
    `;

    try {
      // Send email if email is configured
      if (config.email.user && config.email.pass) {
        const transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          auth: {
            user: config.email.user,
            pass: config.email.pass,
          },
        });

        await transporter.sendMail({
          from: config.email.user,
          to: user.email,
          subject: 'Password Reset Request',
          text: message,
        });

        res.json({
          success: true,
          message: 'Password reset email sent',
        });
      } else {
        // Email not configured - return token for development
        res.json({
          success: true,
          message: 'Password reset token generated (email not configured)',
          resetToken: resetToken, // Only for development
          resetUrl: resetUrl,
        });
      }
    } catch (error) {
      console.error('Email send error:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Error sending email. Please try again later.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
    });
  }
};

// @desc    Get all pending user requests
// @route   GET /api/auth/pending-users
// @access  Private/Admin
export const getPendingUsers = async (req, res) => {
  try {
    // Build query based on current user's role
    let query = { status: 'pending' };
    
    if (req.user.role === 'admin') {
      // Regular admins (doctors) can only see pending pharmacists
      query.role = 'pharmacist';
    } else if (req.user.role === 'super_admin') {
      // Super admin can see both pending admins and pharmacists
      query.role = { $in: ['admin', 'pharmacist'] };
    } else {
      // Pharmacists cannot approve anyone
      return res.json({
        success: true,
        count: 0,
        data: { users: [] },
      });
    }

    const pendingUsers = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingUsers.length,
      data: {
        users: pendingUsers,
      },
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending users',
    });
  }
};

// @desc    Approve user registration
// @route   PUT /api/auth/approve-user/:userId
// @access  Private/Admin
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User is not in pending status',
      });
    }

    // Check permission: regular admin can only approve pharmacists
    if (req.user.role === 'admin' && user.role !== 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'You can only approve pharmacist registrations. Contact super admin for doctor approvals.',
      });
    }

    // Super admin can approve both admins and pharmacists
    if (req.user.role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve users.',
      });
    }

    user.status = 'active';
    user.approvedBy = req.user._id;
    user.approvedAt = Date.now();
    await user.save();

    // TODO: Send approval email to user

    const roleLabel = user.role === 'admin' ? 'Doctor/Admin' : 'Pharmacist';

    res.json({
      success: true,
      message: `${roleLabel} approved successfully`,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user',
    });
  }
};

// @desc    Reject user registration
// @route   PUT /api/auth/reject-user/:userId
// @access  Private/Admin
export const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User is not in pending status',
      });
    }

    // Check permission: regular admin can only reject pharmacists
    if (req.user.role === 'admin' && user.role !== 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'You can only reject pharmacist registrations. Contact super admin for doctor rejections.',
      });
    }

    if (req.user.role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject users.',
      });
    }

    user.status = 'rejected';
    await user.save();

    // TODO: Send rejection email to user

    res.json({
      success: true,
      message: 'User rejected',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user',
    });
  }
};

// @desc    Get all users (for admin)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    });
  }
};
