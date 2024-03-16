'use strict'

const moment = require('moment/moment')
const db = require('../db')
const {copyAndExcludes,isEmpty} = require ('../util')
const {generateKeyPairSync} = require("crypto")
const { env } = require('process')
const bcrypt = require("bcrypt")
const hashPassword = async (plaintextPassword) =>{
    const hash = await bcrypt.hash(plaintextPassword, 10);
     // Store hash in the database
    return hash;
}
 

module.exports = {
    get: async (req, res) => {
        let sql = `SELECT users.*
        FROM users 
        LEFT JOIN user_role
        ON users.id = user_role.user_id
		LEFT JOIN roles 
        ON user_role.role_id = roles.id
        WHERE roles.code = 'STAFF' AND users.status != 0;
        `
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: response})
            console.log("users",response)
            if(response.length==0)
            {
                res.send({result:"okie",data:[]})
            }
            else
            {
                let newUsers = response.map(item=>copyAndExcludes(item,["publicKey","privateKey","refreshToken","password","updated_date","updated_by","created_date","created_by"]))
                res.send({result:"okie",data:newUsers})
            }
        })
    },
    detail: async (req, res) => {
        let userId = req.params.userId;
        let sql = `SELECT * FROM users WHERE id=${userId}`
        console.log("sql",sql)
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: response})
            console.log(response)
            if(response.length==0)
            {
                res.send({result:"Failed",data:{user:{},members:[]}})
            }
            let newUsers = response.map(item=>copyAndExcludes(item,["publicKey","privateKey","refreshToken","password","updated_date","updated_by","created_date","created_by"]))
            let userMain = newUsers.find(item=>userId==item.id)
            let members = newUsers.filter(item=>userId!=item.id)
            res.send({result:"okie",data:{user:userMain,members:members}})
        })
    },
    update: async (req, res) => {
        let data = req.body;
        let userId = req.params.userId;
        data.updated_by = req.userId
        if(!isEmpty(data.password)) {
            data.password= await hashPassword(data.password)
        }
        console.log("update",data)
        let sql = 'UPDATE users SET ? WHERE id = ?'
            db.query(sql, [data, userId], (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else {
                res.send({result:"okie",message: 'Cập nhật thành công!'})
            }
        })
      
    },
    updateStatus: async (req, res) => {
        let data = req.body;
        var queries = '';
        // console.log("data",data)
        let _data = data.map(item=>({...item,updated_by:req.userId,updated_date:moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}))
        _data.forEach(function (item) {
            // console.log(item)
            queries += `UPDATE users SET status = ${item.status} ,updated_by = ${item.updated_by} ,updated_date = '${item.updated_date}' WHERE id = ${item.id} ; `
        });
        // console.log("queries",queries)
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Cập nhập thành công!'})
        })
      
    },
    delete: async (req, res) => {
        let sql = 'DELETE FROM users WHERE id = ?'
        db.query(sql, [req.params.userId], (err, response) => {
            if (err) throw err
            res.send({message: 'Xóa thành công!'})
        })
    },
    deletes: async (req, res) => {
        let ids = req.body
        var queries = '';
        let updated_by = req.userId
        ids.forEach(function (item) {
            queries += `UPDATE users SET status = 0, updated_by = ${updated_by}  WHERE id = ${item.id} ;`
        });
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Xóa thành công!'})
        })
    },
    changeInfo: async (req, res) => {
        let userId = req.params.userId;
        let data ={}
        let { newPassword, firstName, lastName } = req.body;

        data.updated_by = req.userId
        data.updated_date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        if(!isEmpty(newPassword)) {
            data.password= await hashPassword(newPassword)
        }
        if(!isEmpty(firstName)) {
            data.first_name= firstName
        }
        data.last_name= lastName
        console.log("update",data)
        let sql = 'UPDATE users SET ? WHERE id = ?'
        db.query(sql, [data, userId], (err, response) => {

            if (err) res.send({result:"Failed",message: response})
            res.send({result:"okie",message: 'Cập nhật thành công!'})
        })
    },
    store: async (req, res) => {
        let data = req.body;
         // check email exist 
         let sql_check = 'SELECT * FROM users'
         db.query(sql_check, async (err, response) => {
             if (err) res.send({message: err, result:"Failed"})
             console.log("res",response) 
             let message = ""
             let passed = true 
             if(response.length>0)
             {
                response.forEach(item=>
                    {
                       if(item.email == data.email && item.status == 1)
                       {
                           passed = false
                           message= 'Email đã tồn tại trong hệ thống!'
                       }
                    })
             }
             console.log("passed",passed)
             if(!passed) res.send({result:"Failed", message:message})
             else 
             {
                data.password = await hashPassword(data.password)
                console.log(data)
                let sql = 'INSERT INTO users SET ?'
                db.query(sql, [data], (err, user_inserted) => {
                    if (err) res.send({message: err, result:"Có lỗi vui lòng liên hệ admin!"})
                    else
                    {
                        console.log("staff_register", user_inserted)
                        let data_user_role = {
                            user_id : user_inserted.insertId,
                            // todo: Lấy id của role STAFF trong bảng roles
                            role_id : 2
                        } 
                        let sql_user_role = 'INSERT INTO user_role SET ?'
                        db.query(sql_user_role, [data_user_role], (err, user_role_inserted) => {
                            if (err) res.send({message: err, result:"Có lỗi vui lòng liên hệ admin!"})
                            else
                            {
                                res.send({result:"okie",message:"Tạo tài khoản nhân viên thành công"})
                            }
                        })
                    }
                })
             }
         })
    },
}
