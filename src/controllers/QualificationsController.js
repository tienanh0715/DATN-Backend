'use strict'

const util = require('util')
const mysql = require('mysql')
const db = require('../db')
const {copyAndExcludes} = require ('../util')
const moment = require('moment/moment')

module.exports = {
    get: async (req, res) => {
        let sql= `SELECT *, \
                (SELECT COUNT(*) FROM users
                WHERE rooms.id = users.room_id) AS number_of_people \
                FROM rooms;` 
        db.query(sql, (err, response) => {
            if (err) throw err
            console.log("rooms",response)
            if(response.length==0)
            {
                res.send({result:"okie",data:[]})
            }
            let newRooms = response.map(item=>copyAndExcludes(item,["updated_date","updated_by","created_at","created_by"]))
            res.send({result:"okie",data:newRooms})
        })
    },
    detail: async (req, res) => {
        let roomId = req.params.roomId;
        let sql = `SELECT rooms.*, users.last_name,users.first_name,users.gender,users.birthday FROM rooms 
        RIGHT JOIN users ON users.room_id = rooms.id WHERE rooms.id = ${roomId};`
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: response})
            console.log(response)
            if(response.length==0)
            {
                res.send({result:"Failed",data:{room:{},members:[]}})
            }
            let newUsers = response.map(item=>copyAndExcludes(item,["updated_date","updated_by","created_at","created_by"]))
            let room = newUsers.find(item=>roomId==item.id)
            res.send({result:"okie",data:{room:room,members:newUsers}})
        })
    },
    update: async (req, res) => {
        let data = req.body;
        // check duplicate info
        let sql_check = 'SELECT * FROM rooms'
        db.query(sql_check, async (err, response) => {
            if (err) res.send({message: err, result:"Failed"})
           //  console.log("res",response) 
            let message = ""
            let passed = true
            response.forEach(item=>
            {
               if(item.floor==data.floor && item.name==data.name && item.address==data.address && item.id != data.id)
               {
                   passed = false
                   message= 'Trùng thông tin'
               }
            })
            console.log("passed",passed)
            if(!passed) res.send({result:"Failed",message:message})
            else 
            {
                data.updated_by = req.userId
                data.updated_date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
                console.log("update",data)
                let sql = 'UPDATE rooms SET ? WHERE id = ?'
                db.query(sql, [data, data.id], (err, response) => {
                    if (err) res.send({result:"Failed",message: response})
                    res.send({result:"okie",message: 'Cập nhật thành công!'})
                })
            }
        })
       
    },
    store: async (req, res) => {
        let data = req.body;
        // check duplicate info
        let sql_check = 'SELECT * FROM rooms'
        db.query(sql_check, async (err, response) => {
            if (err) res.send({message: err, result:"Failed"})
           //  console.log("res",response) 
            let message = ""
            let passed = true
            response.forEach(item=>
            {
               if(item.floor==data.floor && item.name==data.name && item.address==data.address)
               {
                   passed = false
                   message= 'Trùng thông tin'
               }
            })
            console.log("passed",passed)
            if(!passed) res.send({result:"Failed",message:message})
            else 
            {
                data.floor = 1
                data.created_by = req.userId
                data.updated_by = req.userId
                data.created_at = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
                data.updated_date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
                let sql = 'INSERT INTO rooms SET ?'
                db.query(sql, [data], (err, response) => {
                    if (err) res.send({message: err, result:"Failed"})
                    res.send({result:"okie",message:"Thêm mới thành công"})
                })
            }
        })
        
    },
    delete: async (req, res) => {
        let sql = 'DELETE FROM rooms WHERE id = ?'
        db.query(sql, [req.params.userId], (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:sql})
            res.send({result:"okie",message: 'Delete success!'})
        })
    },
    deletes: async (req, res) => {
        let ids = req.body
        var queries = '';
        ids.forEach(function (item) {
            queries += `DELETE FROM rooms WHERE id = ${item.id} ; `
        });
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Delete success!'})
        })
    }
}
