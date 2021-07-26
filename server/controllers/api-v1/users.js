const router = require('express').Router()
const db = require('../../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authLockedRoute = require('./authLockedRoute')

router.get('/', (req, res) => {
    res.json({ msg: '🖖🏻 hey there user endpoint is okie dokie'})
})
router.post('/register', async (req, res) => {
    try {
        //checking if the user exists 
        const findUser = await db.User.findOne({
            email: req.body.email
        })
        //if user found, they cant register 
        if(findUser) return res.status(400).json({msg: 'user already exists'})
        console.log(findUser)
        //hashed password
        const password = req.body.password
        const salt = 12
        const hashedPassword = await bcrypt.hash(password, salt)

        //creating new user
        const newUser = db.User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        await newUser.save()

        //create jwt payload
        const payload = {
            name: newUser.name,
            email: newUser.email,
            id: newUser.id
        }
        //sign jwt and send response
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 60 * 60 })
        res.json({ token })
    } catch (err) {
        console.log(`ERPPT 🤖 ERROR:: ${err}`)
        res.status(500).json({ msg: 'internal server error'})
    }
})

// POST /user/login --- validate login credentials
router.post('/login', async (req, res) => {
    try {
        //try to find the user in the database ((with the emailz))req.body.emai;
        const findUser = await db.User.findOne({
            email: req.body.email
        })
        const validationFailedMsg = 'Incorrect credentials 🔫  do it again, do it better'

        //if the user is found -- return immediately to register
        if(!findUser) return res.status(400).json({ msg: validationFailedMsg })

        //check the users password from the db against what is in the req.body
        const matchPassword = await bcrypt.compare(req.body.password, findUser.password)

        //if the password doesnt match, -- return immediately
        if(!matchPassword) return res.status(400).json({ msg: validationFailedMsg })

        // create the jwt payload
        const payload = {
            name: findUser.name,
            email: findUser.email,
            id: findUser.id
        }

        //sign the jwt and send it back
        const token = await jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 60*60 })
        res.json({ token })
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: 'internal server error' })
    }
})

// GET /auth-locked -- middleware that checks if userware is allowed to be here - will redirect if a bad jwt is found
//can be applied to any amount of routes, always require the header
router.get('/auth-locked', authLockedRoute, (req, res) => {
    //do whatever we like with the user
    console.log(res.locals.user)
    //send private data back
    res.json({ msg: 'welcome to the auth locked route you lucky dog 🐕'})
})
module.exports = router