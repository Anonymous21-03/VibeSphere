import express from 'express'
import { signupUser, loginUser, logoutUser, verifyToken } from '../controllers/userController.js';

const router = express.Router()

router.post('/signup', signupUser)
router.post('/login', loginUser)
// router.post('/forgot-password', forgotpass)
// router.post('/reset-password/:token', resetPassword)
// router.get('/verify', verifyUser, (req, res) => {
//     return res.json({ status: true, message: "authorized" })
// })
router.get('/logout', logoutUser)
router.get('/verify-token', verifyToken)

export default router;