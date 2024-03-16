const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
	const authHeader = req.header('Authorization')
	const token = authHeader && authHeader.split(' ')[1]
	console.log("token",token)

	if (!token || token=="not-set") return res.send({ connection: "not-allowed"}) // .status(401)

	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
		req.userId = decoded.id
		console.log("user_implement",decoded)
		// todo check permission
		next()
	} catch (error) {
		console.log("error",error)
		if(error.namme=="TokenExpiredError" || error.message=="jwt expired")
		{
			return res.send({connection:"expired-token"}) // .status(403)
		}
		else
		{
			return res.send({connection:"invalid-token"}) //.status(403)
		}
	}
}

module.exports = verifyToken
