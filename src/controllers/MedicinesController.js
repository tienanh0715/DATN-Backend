'use strict'

const moment = require('moment/moment')
const db = require('../db')
const {copyAndExcludes,isEmpty} = require ('../util')
const { env } = require('process')
const bcrypt = require("bcrypt")
const path = require("path")
const hashPassword = async (plaintextPassword) =>{
    const hash = await bcrypt.hash(plaintextPassword, 10);
     // Store hash in the database
    return hash;
}
 const fs = require('fs');


module.exports = {
    get: async (req, res) => {
        let sql = `SELECT * FROM medicines WHERE status != 0;`
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: response})
            console.log("medicines",response)
            if(response.length==0)
            {
                res.send({result:"okie",data:[]})
            }
            else
            {
                let newmedicines = response.map(item=>item)
                res.send({result:"okie",data:newmedicines})
            }
        })
    },
    detail: async (req, res) => {
        let medicineId = req.params.id;
        let sql = `SELECT * FROM medicines WHERE id=${medicineId}`
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: response})
            else {
                console.log("medicineDetail",response)
                if(response.length==0)
                {
                    res.send({result:"Failed",data:{}})
                }
                else
                {
                    res.send({result:"okie",data:response[0]})
                }
            }
        })
    },
    update: async (req, res) => {
        let data = req.body;
        data.updated_by = req.userId
        let id = req.params.id;
        console.log("update",data)
        let sql = 'UPDATE medicines SET ? WHERE id = ?'
        db.query(sql, [data, id], (err, response) => {
            if (err) res.send({result:"Failed", message: "Có lỗi hãy liên hệ admin"})
            else {
                res.send({result:"okie", message: 'Cập nhật thành công!'})
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
            queries += `UPDATE medicines SET status = ${item.status} ,updated_by = ${item.updated_by} ,updated_date = '${item.updated_date}' WHERE id = ${item.id} ; `
        });
        // console.log("queries",queries)
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Cập nhập thành công!'})
        })
      
    },
    store: async (req, res) => {
        let data = req.body;
        // console.log("data",data)
        // xử lý sau khi có đăng nhập
        data.created_by = req.userId
        data.updated_by = req.userId
        console.log("medicineInsert",data)
        let sql = 'INSERT INTO medicines SET ?'
        db.query(sql, [data], (err, response) => {
             if (err) res.send({message: err, result:"Failed"})
             else {
                 res.send({result:"okie",message:"Thêm mới thành công"})
             }
        })
    },
    delete: async (req, res) => {
        let id = req.params.id
        let sql = 'UPDATE medicines SET status = 0 WHERE id = ?'
        db.query(sql, [id], (err, medicine_update) => {
            if(err) 
            {
                res.send({result:"Failed", message: 'Có lỗi vui lòng báo admin!'})
            }
            else
            {
                res.send({result:"okie", message: 'Xóa thành công!'})
            }
        })
    },
    deletes: async (req, res) => {
        let ids = req.body
        var queries = '';
        let updated_by = req.userId
        ids.forEach(function (item) {
            queries += `UPDATE medicines SET status = 0, updated_by = ${updated_by} WHERE id = ${item.id} ; `
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
        let sql = 'UPDATE medicines SET ? WHERE id = ?'
        db.query(sql, [data, userId], (err, response) => {

            if (err) res.send({result:"Failed",message: response})
            res.send({result:"okie",message: 'Cập nhật thành công!'})
        })
    }
}
