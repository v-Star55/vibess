import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        profileImage: {
            type: String,
            default: "", // always better to have a default
        },
        bannerImage: {
            type: String,
            default: "", // always better to have a default
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 160, // optional limit, like Twitter's bio
            default: "",
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
            },
        ],
        bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
            },
        ],
        // ✅ Social relationships
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isVerified: {
            type: Boolean,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: Number,
        },
        otpExpires: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },
        verificationToken: {
            type: String,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordTokenExpires: {
            type: Date,
        },
        readyToListen: {
            type: Boolean,
            default: false,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
        locationPermissionGranted: {
            type: Boolean,
            default: false,
        },
        lastLocationUpdate: {
            type: Date,
        },
        // GP Creation Limits
        gpCreationHistory: [
            {
                gpId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Group",
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        lastGPCreationAt: {
            type: Date,
            default: null,
        },
        gpCooldownUntil: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for geospatial queries
userSchema.index({ "location.coordinates": "2dsphere" });

userSchema.index({ email: 1, username: 1 }); // for faster lookups

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
