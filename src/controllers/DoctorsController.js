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
        let sql = `SELECT users.*, qualifications.id as qualification_id, qualifications.degree, qualifications.specialization, qualifications.university, qualifications.year, qualifications.status as qualification_status
        FROM users
        LEFT JOIN user_role ON users.id = user_role.user_id
        LEFT JOIN roles ON user_role.role_id = roles.id
        LEFT JOIN qualifications ON users.id = qualifications.user_id
        WHERE roles.code = 'DOCTOR' AND users.status != 0
        ORDER BY users.id;
        `
        db.query(sql, async (err, results) => {
            if (err) res.send({result:"Failed",message: err})
            else
            {
                console.log("doctors",results)
                if(results.length==0)
                {
                    res.send({result:"okie",data:[]})
                }
                else
                {
                    // create an array of doctors
                    const doctors = [];
                    results.forEach(item=>{
                        let findIndex = doctors.findIndex(i =>i.id == item.id)
                        console.log(findIndex)
                        if( findIndex == -1)
                        {
                            let newDoctor = {...item}
                            newDoctor.qualifications = []
                            doctors.push(newDoctor)
                            // console.log("doctor",newDoctor)
                        }
                    })
                    // console.log("doctors",doctors)

                    results.forEach((item) => {
                        // add the qualification to the current doctor's qualifications array
                        let doctor = doctors[doctors.findIndex(i=>i.id == item.id)]
                        console.log("doctor",doctor)
                        if(item.qualification_id != null)
                        {
                            console.log("status",item.status)
                            doctor.qualifications.push({
                                id: item.qualification_id,
                                degree: item.degree,
                                specialization: item.specialization,
                                university: item.university,
                                year: item.year,
                                status:item.qualification_status
                            });
                        }
                    });
                    console.log("newDoctors",doctors)
    
                    // send the array of doctors as a response
                    let newDoctors = doctors.map(item=>copyAndExcludes(item,["password","qualification_status",
                    "updated_date","updated_by","created_date","created_by",
                    "qualification_id", "degree", "specialization", "university", "year"]))
                    newDoctors = newDoctors.map(item=> {return {...item,schedules_of_week:[]}})
                    //get days_of_week
                    let query_days_of_week = "SELECT * FROM doctor_week_days ORDER BY day_of_week; "

                    db.query(query_days_of_week, async (err,results)=>{
                        if (err) res.send({result:"Failed",message: err})
                        else
                        {
                            if(results.length>0)
                            {
                                console.log("results",results)
                                results.forEach(item=>{
                                    newDoctors.find(u=>u.id==item.user_id)?.schedules_of_week.push(item) 
                                })
                            }
                            
                            res.send({result:"okie",data:newDoctors})
                        }

                    })
                
                }
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
            let newDoctors = response.map(item=>copyAndExcludes(item,["password","updated_date","updated_by","created_date","created_by"]))
            let userMain = newDoctors.find(item=>userId==item.id)
            let members = newDoctors.filter(item=>userId!=item.id)
            res.send({result:"okie",data:{user:userMain,members:members}})
        })
    },
    updateSchedule: async (req, res) => {
        let data = req.body;
        let userId = req.params.userId;
        let updated_by = req.userId
        const data_user = {
            session_meeting_time: data.session_meeting_time,
            session_gap: data.session_gap,
        }
        console.log("update",data)
        let sql = 'UPDATE users SET ? WHERE id = ?'
            db.query(sql, [data_user, userId], (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else 
            {
                db.beginTransaction((err) => {
                    if (err) {
                        res.send({result:"Failed",message: err})
                    }
                    else
                    {
                        for (const dayOfWeek of data.days_of_week) {
                            const { id, session_time, day_of_week, status } = dayOfWeek;
                            const queryText = `
                              INSERT INTO doctor_week_days (id, user_id, day_of_week, session_time, status,created_by,updated_by)
                              VALUES (?,?, ?, ?, ?, ?, ?)
                              ON DUPLICATE KEY UPDATE
                              session_time = VALUES(session_time),
                              status = VALUES(status);
                            `;
                            const values = [id,data.id, day_of_week, session_time, status,updated_by,updated_by];
                      
                            db.query(queryText, values, (err, result) => {
                              if (err) {
                                console.error('Error while inserting or updating day_of_week:', err);
                                return db.rollback(() => {
                                      res.send({result:"Failed",message: 'Internal server error' })
                                });
                              }
                            });
                          }
                      
                          db.commit((err) => {
                            if (err) {
                              console.error('Error while committing transaction:', err);
                              return db.rollback(() => {
                                  res.send({result:"Failed",message: 'Internal server error' })
                              });
                            }
                            else
                            {
                                console.log('Successfully inserted or updated day_of_week');
                                res.send({result:"okie",message: 'Cập nhật thành công' })
                            }
                              
                          });
                    }
                   
                });
            }
        })
      
    },
    update: async (req, res) => {
        let data = req.body;
        let userId = req.params.userId;
        data.updated_by = req.userId
        if(!isEmpty(data.password)) {
            data.password= await hashPassword(data.password)
        }
        let qualifications = data.qualifications
        delete data.qualifications
        delete data.schedules_of_week
        console.log("update",data)
        let sql = 'UPDATE users SET ? WHERE id = ?'
            db.query(sql, [data, userId], (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else {
                db.beginTransaction((err) => {
                    if (err) {
                        res.send({result:"Failed",message: err})
                    }
                    else
                    {
                        for (const qualification of qualifications) {
                            const { id, degree, specialization, university,year, status } = qualification;
                            const queryText = `
                              INSERT INTO qualifications (id, user_id, degree, specialization, university,year,status,created_by,updated_by)
                              VALUES (?, ?, ?, ?, ?, ?, ?,?,?)
                              ON DUPLICATE KEY UPDATE
                              degree = VALUES(degree),
                              specialization = VALUES(specialization),
                              university = VALUES(university),
                              year = VALUES(year),
                              status = VALUES(status);
                            `;
                            const values = [id,userId, degree, specialization, university,year, status,data.updated_by,data.updated_by];
                      
                            db.query(queryText, values, (err, result) => {
                              if (err) {
                                console.error('Error while inserting or updating qualification:', err);
                                return db.rollback(() => {
                                      res.send({result:"Failed",message: 'Internal server error' })
                                });
                              }
                            });
                          }
                      
                          db.commit((err) => {
                            if (err) {
                              console.error('Error while committing transaction:', err);
                              return db.rollback(() => {
                                  res.send({result:"Failed",message: 'Internal server error' })
                              });
                            }
                            else
                            {
                                console.log('Successfully inserted or updated qualification');
                                res.send({result:"okie",message: 'Cập nhật thành công' })
                            }
                              
                          });
                    }
                   
                });
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
    store: async (req, res) => {
        let data = req.body;
        let qualifications = [...data.qualifications]
        // check username and email exist 
        let sql_check = 'SELECT * FROM users'
        db.query(sql_check, async (err, response) => {
            if (err) res.send({message: err, result:"Failed"})
            //  console.log("res",response) 
            let message = ""
            let passed = true
            response.forEach(item=>
            {
                if(item.email == data.email && item.status == 1)
                {
                    passed = false
                    message= 'Trùng email'
                }
                
            })
            console.log("passed",passed)
            if(!passed) res.send({result:"Failed",message:message})
            else 
            {
                data.created_by = req.userId
                data.updated_by = req.userId
                data.password = await hashPassword(data.password)
                delete data.qualifications
                let sql = 'INSERT INTO users SET ?'
                db.query(sql, [data], (err, user_inserted) => {
                    if (err) res.send({message: "2", result:"Failed"})
                    else
                    {
                        let data_user_role = {
                            user_id : user_inserted.insertId,
                            // todo: Lấy id của role DOCTOR trong bảng roles
                            role_id : 3
                        } 
                        let sql_user_role = 'INSERT INTO user_role SET ?'
                        db.query(sql_user_role, [data_user_role], (err, user_role_inserted) => {
                            if (err) res.send({message: "3", result:"Failed"})
                            else
                            {
                                // Duyệt qua mảng qualifications và thêm dữ liệu vào bảng qualification
                                const sql_insert_qualification = "INSERT INTO qualifications (degree, specialization, university, year,updated_by,user_id,created_by) VALUES ?";
                                const values = qualifications.map(qualification => [qualification.degree, qualification.specialization, qualification.university, qualification.year,req.userId,user_inserted.insertId,req.userId]);
                                
                                db.query(sql_insert_qualification,[values], (error, results) => {
                                    if (error) res.send({message: error, result:"Failed"})
                                    else
                                    {
                                        res.send({result:"okie",message:"Tạo tài khoản bác sĩ thành công"})
                                        console.log(`Đã thêm ${results.affectedRows} dòng vào bảng qualification`);
                                    }
                                });
                            }
                        })
                    }
                })
            }
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
            queries += `UPDATE users SET status = 0, updated_by = ${updated_by}  WHERE id = ${item.id} ;  `
        });
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Xóa thành công!'})
        })
    },
  
}
