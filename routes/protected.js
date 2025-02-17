const router = require('express').Router()
const Job = require('../models/Job')
const User = require('../models/User')
const googleService = require('../googleServices')
const { checkAuthenticated } = require('../middleware/auth.mw')
const localStorage = require('../middleware/storage.mw')
const fs = require('fs')

const service = new googleService()

router.get('/create-job', checkAuthenticated, async (req, res) => {
    const user = await req.user
    const username = user.name
    res.render('create-job', { name: username })
})

router.get('/dashboard', checkAuthenticated, async (req, res) => {
    const user = await req.user
    const username = user.name
    const userAvatar = user.avatar
    const userEmail = user.email
    const dateJoined = user.createdAt
    const jobs = await Job.find({ emailOwner: userEmail })
    const acceptedJobs = await Job.find({ emailLabellers: userEmail })
    res.render('dashboard', {
        userJobs: jobs,
        avatar: userAvatar,
        acceptedJobs: acceptedJobs,
        name: username,
        dateJoined
    })
})

router.get('/accepted-jobs', checkAuthenticated, async (req, res) => {
    const user = await req.user
    const username = user.name
    const userAvatar = user.avatar
    const userEmail = user.email
    const dateJoined = user.createdAt
    const jobs = await Job.find({ emailOwner: userEmail })
    const acceptedJobs = await Job.find({ emailLabellers: userEmail })
    res.render('accepted-jobs', {
        userJobs: jobs,
        avatar: userAvatar,
        acceptedJobs: acceptedJobs,
        name: username,
        dateJoined
    })
})

router.get('/secret-page', checkAuthenticated, (req, res) => {
    res.send('bruh')
})

router.post('/dashboard', checkAuthenticated, async (req, res) => {
    const id = req.body.id

    try {
        const job = await Job.findById(id)
        const imgArr = job.images
        await service.deleteFiles(imgArr)
        const deleted = await Job.deleteOne({ _id: id })

        res.redirect('/dashboard')
    } catch {
        res.redirect(400, '/')
    }
})

router.post('/user-profile', checkAuthenticated, localStorage.single('image'), async (req, res) => {
    try {
        const user = await req.user
        const userID = user._id
        const dbUser = await User.findOne({ _id: userID })

        let name = req.body.name
        if (!name) {
            name = user.name
        }

        let password = req.body.password
        if (!password) {
            password = user.password
        }

        if (req.file) {
            console.log('printing file')
            const imgPath = 'public/uploads/'
            const localImg = String(fs.readdirSync(imgPath))

            const result = await service.uploadFile(localImg, imgPath)
            const driveImg = `https://drive.google.com/uc?id=${result.data.id}`
            dbUser.avatar = driveImg

            fs.rm(imgPath + result.data.name, (err) => {
                if (err) {
                    console.log(err)
                }
            })
        }

        dbUser.name = name
        dbUser.password = password

        await dbUser.save()

        res.redirect('/dashboard')
    } catch (e) {
        console.log(e)
        res.redirect('/')
    }

    // dbUser.name = name
    // dbUser.password = password
    // // dbUser.avatar = driveImg

    // dbUser
    //     .save()
    //     .then((res) => {
    //         console.log(res)
    //     })
    //     .catch((e) => {
    //         console.log(e)
    //     })

    // res.redirect('/dashboard')
})

// router.post('/user-profile', checkAuthenticated, localStorage.single('image'), async (req, res) => {
//     try {
//         const user = await req.user
//         const userID = user._id
//         const dbUser = await User.findOne({ _id: userID })

//         let name = req.body.name
//         if (!name) {
//             name = user.name
//         }

//         let password = req.body.password
//         if (!password) {
//             password = user.password
//         }
//         let driveImg
//         if (!req.file) {
//             console.log('didnt detect image')
//             driveImg = user.avatar
//         } else {
//             console.log(req.file)
//             const imgPath = 'public/uploads/'
//             const localImg = String(fs.readdirSync(imgPath))

//             const result = await service.uploadFile(localImg, imgPath)
//             driveImg = `https://drive.google.com/uc?id=${result.data.id}`

//             fs.rmSync(imgPath + result.data.name)
//         }

//         dbUser.name = name
//         dbUser.password = password
//         dbUser.avatar = driveImg

//         dbUser
//             .save()
//             .then((res) => {
//                 console.log(res)
//             })
//             .catch((e) => {
//                 console.log(e)
//             })

//         try {
//             res.redirect('/dashboard')
//         } catch (error) {
//             console.log(error)
//         }
//     } catch (e) {
//         console.log(e)
//         res.redirect(400, '/')
//     }
// })

router.post('/cancelJob', checkAuthenticated, async (req, res) => {
    try {
        const id = req.body.jobId
        const user = await req.user
        const userEmail = user.email
        const updated = await Job.findOneAndUpdate(
            { _id: id },
            {
                $pull: {
                    emailLabellers: userEmail
                }
            }
        )
        res.redirect('/dashboard')
    } catch {
        res.redirect(400, '/')
    }
})

router.get('/user-profile', checkAuthenticated, async (req, res) => {
    const user = await req.user
    const username = user.name
    const userAvatar = user.avatar
    const userEmail = user.email
    res.render('user-profile', { name: username, email: userEmail, avatar: userAvatar })
})

router.get('/do-job', async (req, res) => {
    const user = await req.user
    const auth = req.isAuthenticated()
    var username = ''
    if (auth) {
        username = user.name
    }
    res.render('do-job', { authenticated: auth, name: username })
})

module.exports = router
