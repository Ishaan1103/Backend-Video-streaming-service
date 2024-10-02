import { Router } from "express"
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js"
import {upload} from '../middlewares/multer.middleware.js'
import VerifyJwt from "../middlewares/auth.middleware.js"

const router = Router()

router.route('/register').post(
    upload.fields(
        [
            {
                name:"avatar",
                maxCount:1
            },
            {
                name:"coverImage",
                maxCount:1
            }
        ]
    ),
    registerUser
)
router.route('/login').post(
    loginUser
)

//Secured Routes

router.route('/logout').post(
    VerifyJwt,
    logoutUser
)
router.route('/refresh-token').post(
    refreshAccessToken
)

router.route('/change-password').post(
    VerifyJwt,
    changeCurrentPassword
)

router.route('/current-user').get(
    VerifyJwt,
    getCurrentUser
)

router.route('/update-account').patch(
    VerifyJwt,
    updateAccountDetails
)

router.route('/avatar').patch(
    VerifyJwt,
    upload.single('avatar'),
    updateUserAvatar
)

router.route('/cover-image').patch(
    VerifyJwt,
    upload.single('coverImage'),
    updateUserCoverImage
)

router.route('/c/:username').get(
    VerifyJwt,
    getUserChannelProfile
)

router.route('/history').get(
    VerifyJwt,
    getWatchHistory
)
export default router