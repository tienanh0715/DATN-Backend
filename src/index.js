const express = require('express')
const cors = require('cors')
const app = express()
const verifyToken = require('./middleware/auth')
const jwt = require('jsonwebtoken')
const db = require('./db')
const {copyAndExcludes} = require ('./util')
const bcrypt = require("bcrypt")
require('dotenv').config()

const port = process.env.PORT

// Third-Party Middleware

app.use(cors());

// Built-In Middleware

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({  limit: '50mb',extended: true }));

// Custom Middleware

app.use((req, res, next) => {
  next();
});


app.use('/public', express.static('public'));

// * Routes * //
app.use('/',require('./routes/user'))
app.use('/',require('./routes/staff'))
app.use('/',require('./routes/guest'))
app.use('/', require('./routes/service'))
app.use('/',require('./routes/medicine'))
app.use('/',require('./routes/doctor'))
app.use('/',require('./routes/patient'))
app.use('/',require('./routes/appointment'))
app.use('/',require('./routes/checkout'))
app.use('/',require('./routes/report'))
app.use('/',require('./routes/review'))

// compare password
const comparePassword= async (plaintextPassword, hash)=> {
	const result = await bcrypt.compare(plaintextPassword, hash);
	return result;
}
// app

const generateTokens = payload => {
	const { id, email, code } = payload

	// Create JWT
	const accessToken = jwt.sign(
		{ id, email, code },
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: '10h'
		}
	)

	const refreshToken = jwt.sign(
		{ id, email, code },
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: '24h'
		}
	)

	return { accessToken, refreshToken }
}

const updateRefreshToken = (email, refreshToken) => {
	let sql = 'UPDATE users SET refreshToken = ? WHERE email = ?'
	db.query(sql, [refreshToken,email], (err, response) => {
		if (err) console.log('err',err)
		console.log('Rows affected:', response.affectedRows)
	})
	
}

app.post('/auth/login', (req, res) => {
	let {email, password} = req.body;
	let sql = `
		SELECT users.*, roles.code as code
        FROM users 
        LEFT JOIN user_role
        ON users.id = user_role.user_id
		LEFT JOIN roles 
        ON user_role.role_id = roles.id
		WHERE email = ?`
	db.query(sql, [email], async (err, response) => {
		if (err) res.send({result:"Failed",message:err})
		else
		{
			// kiểm tra xem có tài khoản trong DB không
			console.log('user',response)
			if(response.length==0) return res.status(401).send({result:"failed",message:"Tài khoảng không thể xác thực, kiểm tra lại thông tin đăng nhập"})

			// Nếu có kiểm tra password
			const user = response.find(user => user.email === email)
			let passed = true

			// check status
			if(user.status !== 1 )
			{
				passed = false
				res.send({result:"failed",message:"Tài khoản đã bị tạm dừng"})
			}
			if(passed)
			{
				if(await comparePassword(password,user.password))
				{
					const tokens = generateTokens(user)
					updateRefreshToken(email, tokens.refreshToken)
					let _user = copyAndExcludes(user,["refreshToken","password","updated_date","updated_by","created_date","created_by"])
					res.send({tokens:tokens,user:_user,result:"okie"})
				}
				else
				{
					res.send({result:"failed",message:"Không đúng mật khẩu"})
				}
			}
		}
	})
})

app.post('/auth/refresh-token', (req, res) => {
	const refreshToken = req.body.refreshToken
	if (!refreshToken) return res.status(401).send({connection:"not-allowed"})

	let user 
	let sql = 'SELECT * FROM users'
	db.query(sql, (err, response) => {
		if (err) res.send({result:"failed",message:"Đăng nhập lại"})

		user = response.find(user => user.refreshToken === refreshToken)
		if (!user) return res.send({connection:"not-allowed"}) // .status(401)
		console.log("user",user)

		try {
			jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
	
			const tokens = generateTokens(user)
			updateRefreshToken(user.email, tokens.refreshToken)
	
			res.json({tokens:tokens,connection:"set-token"})
		} catch (error) {
			console.log("error refresh",error)
			if(error.namme=="TokenExpiredError" || error.message=="jwt expired")
			{
				return res.send({connection:"expired-token"}) // .status(403)
			}
			else
			{
				return res.send({connection:"invalid-token"}) //.status(403)
			}
		}
	})
	

	
})

app.delete('/auth/logout', verifyToken, (req, res) => {
	let sql = `UPDATE users SET refreshToken = '' WHERE id = ${req.userId}`
	console.log("logout",req.userId)
	db.query(sql, (err, response) => {
		if (err) res.send({result:"Failed",message: response})
		res.send({result:"okie",message: 'Logout successfully!'})
	})
})

app.listen(port, () => {
  console.log("Listening on port: " + port);
})
