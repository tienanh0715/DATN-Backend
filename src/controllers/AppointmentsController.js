'use strict'

const moment = require('moment/moment')
const db = require('../db')
const {copyAndExcludes,isEmpty} = require ('../util')
const { env } = require('process')
const bcrypt = require("bcrypt")
module.exports = {
    get: async (req, res) => {
        let sql = `SELECT 
        a.*,
        u1.id AS doctor_id,
        CONCAT(u1.full_name) AS doctor_fullName,
        u1.email AS doctor_email,
        u1.avatar AS doctor_avatar,
        CASE
            WHEN a.patient_type = 1 THEN CONCAT(u2.full_name)
            WHEN a.patient_type = 2 THEN CONCAT(g.full_name)
            ELSE NULL
        END AS patient_fullName,
        CASE
            WHEN a.patient_type = 1 THEN u2.id
            WHEN a.patient_type = 2 THEN g.id
            ELSE NULL
        END AS patient_id,
        CASE
            WHEN a.patient_type = 1 THEN u2.email
            WHEN a.patient_type = 2 THEN NULL
            ELSE NULL
        END AS patient_email,
        CASE
            WHEN a.patient_type = 1 THEN u2.avatar
            WHEN a.patient_type = 2 THEN NULL
            ELSE NULL
        END AS patient_avatar,
        CASE
            WHEN a.patient_type = 1 THEN u2.phone
            WHEN a.patient_type = 2 THEN g.phone
            ELSE NULL
        END AS patient_phone,
        CASE
            WHEN a.patient_type = 1 THEN NULL
            WHEN a.patient_type = 2 THEN g.identity_card_number
            ELSE NULL
        END AS patient_identity_card_number,
        CASE
            WHEN a.patient_type = 1 THEN NULL
            WHEN a.patient_type = 2 THEN g.address
            ELSE NULL
        END AS patient_address,
        u3.full_name as payment_user_name,
        u3.email as payment_user_email,
        s.id AS service_id,
        s.name AS service_name,
        s.charge AS service_charge,
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.unit AS medicine_unit,
        m.image AS medicine_image,
        m.origin AS medicine_origin,
        p.uses AS medicine_uses
        FROM 
            appointments a
        LEFT JOIN 
            users u1 ON a.doctor_id = u1.id
        LEFT JOIN 
            users u2 ON a.patient_id = u2.id AND a.patient_type = 1
        LEFT JOIN 
            users u3 ON a.payment_user_id = u3.id
        LEFT JOIN 
            guests g ON a.patient_id = g.id AND a.patient_type = 2
        LEFT JOIN 
            appointments_infos ai ON a.id = ai.appointment_id
        LEFT JOIN 
            services s ON ai.service_id = s.id
        LEFT JOIN 
            prescriptions p ON a.id = p.appointment_id
        LEFT JOIN 
            medicines m ON p.medicine_id = m.id
        ORDER BY 
            a.date DESC, a.session_time DESC;
        `
        
        db.query(sql, (err, results) => {
            if (err) res.send({result:"Failed",message: results})
            else 
            {
                // console.log("appointments",results)
                if(results.length==0)
                {
                    res.send({result:"okie",data:[]})
                }
                else
                {
                    const formattedAppointments = [];

                    for (const appointment of results) {
                        const {
                        service_id,
                        service_name,
                        service_charge,
                        medicine_id,
                        medicine_name,
                        medicine_unit,
                        medicine_image,
                        medicine_origin,
                        medicine_uses
                        } = appointment;

                        let formattedAppointment = formattedAppointments.find(
                        (item) => item.id === appointment.id
                        );

                        if (!formattedAppointment) {
                            formattedAppointment = {

                                ...appointment,
                                services: [],
                                medicines: []
                            };
                            formattedAppointments.push(formattedAppointment);
                        }

                        if (service_id && service_name && service_charge) {
                            if(!formattedAppointment.services.some(item=>item.id ==service_id))
                            {
                                formattedAppointment.services.push({
                                    id: service_id,
                                    name: service_name,
                                    charge: service_charge
                                });
                            }
                        }

                        if (
                        medicine_id &&
                        medicine_name &&
                        medicine_unit &&
                        medicine_image &&
                        medicine_origin &&
                        medicine_uses
                        ) {
                            if(!formattedAppointment.medicines.some(item=>item.id==medicine_id))
                            {
                                formattedAppointment.medicines.push({
                                    id: medicine_id,
                                    name: medicine_name,
                                    unit: medicine_unit,
                                    image: medicine_image,
                                    origin: medicine_origin,
                                    usage: medicine_uses
                                });
                            }
                        }
                    }
                    res.send({result:"okie",data:formattedAppointments})
                }
            }
            
        })
    },
    detail: async (req, res) => {
        let appointmentId = req.params.appointmentId;
        let sql = `SELECT 
        a.*,
        u1.id AS doctor_id,
        CONCAT(u1.full_name) AS doctor_fullName,
        u1.email AS doctor_email,
        u1.avatar AS doctor_avatar,
        CASE
            WHEN a.patient_type = 1 THEN CONCAT(u2.full_name)
            WHEN a.patient_type = 2 THEN CONCAT(g.full_name)
            ELSE NULL
        END AS patient_fullName,
        CASE
            WHEN a.patient_type = 1 THEN u2.id
            WHEN a.patient_type = 2 THEN g.id
            ELSE NULL
        END AS patient_id,
        CASE
            WHEN a.patient_type = 1 THEN u2.email
            WHEN a.patient_type = 2 THEN NULL
            ELSE NULL
        END AS patient_email,
        CASE
            WHEN a.patient_type = 1 THEN u2.avatar
            WHEN a.patient_type = 2 THEN NULL
            ELSE NULL
        END AS patient_avatar,
        CASE
            WHEN a.patient_type = 1 THEN u2.phone
            WHEN a.patient_type = 2 THEN g.phone
            ELSE NULL
        END AS patient_phone,
        CASE
            WHEN a.patient_type = 1 THEN NULL
            WHEN a.patient_type = 2 THEN g.identity_card_number
            ELSE NULL
        END AS patient_identity_card_number,
        CASE
            WHEN a.patient_type = 1 THEN NULL
            WHEN a.patient_type = 2 THEN g.address
            ELSE NULL
        END AS patient_address,
        u3.full_name as payment_user_name,
        u3.email as payment_user_email,
        s.id AS service_id,
        s.name AS service_name,
        s.charge AS service_charge,
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.unit AS medicine_unit,
        m.image AS medicine_image,
        m.origin AS medicine_origin,
        p.uses AS medicine_uses
        FROM 
            appointments a
        LEFT JOIN 
            users u1 ON a.doctor_id = u1.id
        LEFT JOIN 
            users u2 ON a.patient_id = u2.id AND a.patient_type = 1
        LEFT JOIN 
            users u3 ON a.payment_user_id = u3.id
        LEFT JOIN 
            guests g ON a.patient_id = g.id AND a.patient_type = 2
        LEFT JOIN 
            appointments_infos ai ON a.id = ai.appointment_id
        LEFT JOIN 
            services s ON ai.service_id = s.id
        LEFT JOIN 
            prescriptions p ON a.id = p.appointment_id
        LEFT JOIN 
            medicines m ON p.medicine_id = m.id
        WHERE a.id = ${appointmentId};
        `
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else {
                console.log("appointmentDetail",response[0])
                res.send({result:"okie",data:response[0]})
            }
           
        })
    },
    update: async (req, res) => {
        let data = req.body;
        data.updated_by = req.userId
        let id = req.params.appointmentId;
        if(data.hasOwnProperty("cancel_reason") &&data.cancel_reason != "")
        {
            data.status=2
        }
        if(data.status==4)
        {
            data.payment_date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss"); 
        }
        if(data.status==3)
        {
            
        }
        console.log("data",data)
        console.log("update",data)
        let sql = 'UPDATE appointments SET ? WHERE id = ?'
        db.query(sql, [data, id], (err, response) => {
            if (err) res.send({result:"Failed", message: "Có lỗi vui lòng liên hệ admin"})
            else {
                res.send({result:"okie", message: 'Cập nhật thành công!'})
            }
        })
    },
    updateInfo:async (req, res) => {
        let { data } = req.body;
        let dataUpdate= JSON.parse(data)
        dataUpdate.updated_by = req.userId
        let id = req.params.appointmentId;
      
        let images = ""
        req.files.forEach(element => {
            images += `${process.env.URL_WEB_APP}/public/uploads/${element.filename}` +";"
        });
        dataUpdate.images = images
        let medicines = dataUpdate.medicines
        delete dataUpdate.medicines
        let find = 'SELECT * from appointments WHERE id = ?'
        db.query(find,[id], (err, response) => {
            if (err) res.send({result:"Failed", message: "Có lỗi vui lòng liên hệ admin"})
            else 
            {
                if(!isEmpty(dataUpdate.payment_fee))
                {
                dataUpdate.payment_amount = parseInt(dataUpdate.payment_fee) + parseInt(response[0].payment_amount)
                }
                console.log("update",dataUpdate)
                let sql = 'UPDATE appointments SET ? WHERE id = ?'
                db.query(sql, [dataUpdate, id], (err, response) => {
                    if (err) res.send({result:"Failed", message: "Có lỗi vui lòng liên hệ admin"})
                    else {
                        for (const medicine of medicines) {
                            const { medicine_id, name, uses } = medicine;
                            const queryText = `
                                INSERT INTO prescriptions (medicine_id, name, uses, status,appointment_id,created_by,updated_by)
                                VALUES (?,?, ?, ?, ?, ?,?)
                                ON DUPLICATE KEY UPDATE
                                medicine_id = VALUES(medicine_id),
                                name = VALUES(name),
                                status = VALUES(status),
                                appointment_id = VALUES(appointment_id),
                                created_by = VALUES(created_by),
                                updated_by = VALUES(updated_by)
                                ;
                            `;
                            const values = [medicine_id, name, uses, 1, dataUpdate.id ,req.userId,req.userId];
                        
                            db.query(queryText, values, (err, result) => {
                                if (err) {
                                console.error('Error while inserting or updating medecine:', err);
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
                                console.log('Successfully inserted or updated medecine');
                                res.send({result:"okie",message: 'Cập nhật thành công' })
                            }
                                
                            });
                    }
                })
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
            queries += `UPDATE appointments SET status = ${item.status} ,updated_by = ${item.updated_by} ,updated_date = '${item.updated_date}' WHERE id = ${item.id} ; `
        });
        // console.log("queries",queries)
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Cập nhập thành công!'})
        })
      
    },
    getByDoctorId: async (req, res) => {
        let { doctor_id,date } = req.body;
        let sql = `SELECT session_time FROM appointments WHERE doctor_id = ${doctor_id} 
        AND date = '${date}' AND status IN (1, 3, 4)`;

        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else 
            {
                if(response.length==0)
                {
                    res.send({result:"okie",data:[]})
                }
                else
                {
                    res.send({result:"okie",data:response})
                }
            }
            
        })
    },
    store: async (req, res) => {
        let data = req.body;
        // console.log("data",data)
         let userId = req.userId
         data.created_by = userId
         data.updated_by = userId
         let services = data.services
         delete data.services
         console.log("serviceInsert",data)
         let sql = 'INSERT INTO appointments SET ?'
         db.query(sql, [data], (err, response) => {
             if (err) res.send({message: err, result:"Failed"})
             else {
                console.log(response)
                for (const service of services) {
                    const { id, charge } = service;
                    const queryText = `
                      INSERT INTO appointments_infos ( created_by, updated_by, status, appointment_id, service_id, service_charge)
                      VALUES (?, ?, ?, ?, ?, ?)
                      ON DUPLICATE KEY UPDATE
                      created_by = VALUES(created_by),
                      updated_by = VALUES(updated_by),
                      status = VALUES(status),
                      appointment_id = VALUES(appointment_id),
                      service_id = VALUES(service_id),
                      service_charge = VALUES(service_charge)
                    `;
                    const values = [ userId, userId, 1, response.insertId, id, charge];
              
                    db.query(queryText, values, (err, result) => {
                      if (err) {
                        console.error('Error while inserting or updating appointments_infos:', err);
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
                        console.log('Successfully inserted or updated appointments_infos');
                        res.send({result:"okie",message: 'Đặt lịch khám thành công' })
                    }
                  });
             }
         })
    },
    delete: async (req, res) => {
        let id = req.params.id
        let sql = 'UPDATE appointments SET status = 0 WHERE id = ?'
        db.query(sql, [id], (err, service_update) => {
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
        let updated_by = req.userId
        
        var queries = '';
        ids.forEach(function (item) {
            queries += `UPDATE appointments SET status = 0, updated_by = ${updated_by}  WHERE id = ${item.id} ; `
        });
        db.query(queries, (err, response) => {
            if (err) res.send({result:"Failed",message: err, queries:queries})
            res.send({result:"okie",message: 'Xóa thành công!'})
        })
    },
    getByDate: async (req, res) => {
        let { from, to } = req.body
        
        let sql = `SELECT 
        a.*,
        u1.id AS doctor_id,
        CONCAT(u1.full_name) AS doctor_fullName,
        u1.email AS doctor_email,
        u1.avatar AS doctor_avatar,
        CASE
            WHEN a.patient_type = 1 THEN CONCAT(u2.full_name)
            WHEN a.patient_type = 2 THEN CONCAT(g.full_name)
            ELSE NULL
        END AS patient_fullName,
        CASE
            WHEN a.patient_type = 1 THEN u2.id
            WHEN a.patient_type = 2 THEN g.id
            ELSE NULL
        END AS patient_id,
        CASE
            WHEN a.patient_type = 1 THEN u2.email
            WHEN a.patient_type = 2 THEN NULL
            ELSE NULL
        END AS patient_email,
        CASE
            WHEN a.patient_type = 1 THEN u2.avatar
            WHEN a.patient_type = 2 THEN NULL
            ELSE NULL
        END AS patient_avatar,
        CASE
            WHEN a.patient_type = 1 THEN u2.phone
            WHEN a.patient_type = 2 THEN g.phone
            ELSE NULL
        END AS patient_phone,
        CASE
            WHEN a.patient_type = 1 THEN NULL
            WHEN a.patient_type = 2 THEN g.identity_card_number
            ELSE NULL
        END AS patient_identity_card_number,
        CASE
            WHEN a.patient_type = 1 THEN NULL
            WHEN a.patient_type = 2 THEN g.address
            ELSE NULL
        END AS patient_address,
        u3.full_name as payment_user_name,
        u3.email as payment_user_email,
        s.id AS service_id,
        s.name AS service_name,
        s.charge AS service_charge,
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.unit AS medicine_unit,
        m.image AS medicine_image,
        m.origin AS medicine_origin,
        p.uses AS medicine_uses
        FROM 
            appointments a
        LEFT JOIN 
            users u1 ON a.doctor_id = u1.id
        LEFT JOIN 
            users u2 ON a.patient_id = u2.id AND a.patient_type = 1
        LEFT JOIN 
            users u3 ON a.payment_user_id = u3.id
        LEFT JOIN 
            guests g ON a.patient_id = g.id AND a.patient_type = 2
        LEFT JOIN 
            appointments_infos ai ON a.id = ai.appointment_id
        LEFT JOIN 
            services s ON ai.service_id = s.id
        LEFT JOIN 
            prescriptions p ON a.id = p.appointment_id
        LEFT JOIN 
            medicines m ON p.medicine_id = m.id
        WHERE 
            DATE(a.date) <= '${to}'
            AND DATE(a.date) >= '${from}'
        ORDER BY 
            a.date DESC, a.session_time DESC;
        `
        if(from=="no-date" && to!="no-date")
        {
          sql= `SELECT 
            a.*,
            u1.id AS doctor_id,
            CONCAT(u1.full_name) AS doctor_fullName,
            u1.email AS doctor_email,
            u1.avatar AS doctor_avatar,
            CASE
                WHEN a.patient_type = 1 THEN CONCAT(u2.full_name)
                WHEN a.patient_type = 2 THEN CONCAT(g.full_name)
                ELSE NULL
            END AS patient_fullName,
            CASE
                WHEN a.patient_type = 1 THEN u2.id
                WHEN a.patient_type = 2 THEN g.id
                ELSE NULL
            END AS patient_id,
            CASE
                WHEN a.patient_type = 1 THEN u2.email
                WHEN a.patient_type = 2 THEN NULL
                ELSE NULL
            END AS patient_email,
            CASE
                WHEN a.patient_type = 1 THEN u2.avatar
                WHEN a.patient_type = 2 THEN NULL
                ELSE NULL
            END AS patient_avatar,
            CASE
                WHEN a.patient_type = 1 THEN u2.phone
                WHEN a.patient_type = 2 THEN g.phone
                ELSE NULL
            END AS patient_phone,
            CASE
                WHEN a.patient_type = 1 THEN NULL
                WHEN a.patient_type = 2 THEN g.identity_card_number
                ELSE NULL
            END AS patient_identity_card_number,
            CASE
                WHEN a.patient_type = 1 THEN NULL
                WHEN a.patient_type = 2 THEN g.address
                ELSE NULL
            END AS patient_address,
            u3.full_name as payment_user_name,
            u3.email as payment_user_email,
            s.id AS service_id,
            s.name AS service_name,
            s.charge AS service_charge,
            m.id AS medicine_id,
            m.name AS medicine_name,
            m.unit AS medicine_unit,
            m.image AS medicine_image,
            m.origin AS medicine_origin,
            p.uses AS medicine_uses
            FROM 
                appointments a
            LEFT JOIN 
                users u1 ON a.doctor_id = u1.id
            LEFT JOIN 
                users u2 ON a.patient_id = u2.id AND a.patient_type = 1
            LEFT JOIN 
                users u3 ON a.payment_user_id = u3.id
            LEFT JOIN 
                guests g ON a.patient_id = g.id AND a.patient_type = 2
            LEFT JOIN 
                appointments_infos ai ON a.id = ai.appointment_id
            LEFT JOIN 
                services s ON ai.service_id = s.id
            LEFT JOIN 
                prescriptions p ON a.id = p.appointment_id
            LEFT JOIN 
                medicines m ON p.medicine_id = m.id
            WHERE 
                DATE(a.date) <= '${to}'
            ORDER BY 
                a.date DESC, a.session_time DESC;
            `
        }
        if(to=="no-date" && from!="no-date")
        {
            sql= `SELECT 
            a.*,
            u1.id AS doctor_id,
            CONCAT(u1.full_name) AS doctor_fullName,
            u1.email AS doctor_email,
            u1.avatar AS doctor_avatar,
            CASE
                WHEN a.patient_type = 1 THEN CONCAT(u2.full_name)
                WHEN a.patient_type = 2 THEN CONCAT(g.full_name)
                ELSE NULL
            END AS patient_fullName,
            CASE
                WHEN a.patient_type = 1 THEN u2.id
                WHEN a.patient_type = 2 THEN g.id
                ELSE NULL
            END AS patient_id,
            CASE
                WHEN a.patient_type = 1 THEN u2.email
                WHEN a.patient_type = 2 THEN NULL
                ELSE NULL
            END AS patient_email,
            CASE
                WHEN a.patient_type = 1 THEN u2.avatar
                WHEN a.patient_type = 2 THEN NULL
                ELSE NULL
            END AS patient_avatar,
            CASE
                WHEN a.patient_type = 1 THEN u2.phone
                WHEN a.patient_type = 2 THEN g.phone
                ELSE NULL
            END AS patient_phone,
            CASE
                WHEN a.patient_type = 1 THEN NULL
                WHEN a.patient_type = 2 THEN g.identity_card_number
                ELSE NULL
            END AS patient_identity_card_number,
            CASE
                WHEN a.patient_type = 1 THEN NULL
                WHEN a.patient_type = 2 THEN g.address
                ELSE NULL
            END AS patient_address,
            u3.full_name as payment_user_name,
            u3.email as payment_user_email,
            s.id AS service_id,
            s.name AS service_name,
            s.charge AS service_charge,
            m.id AS medicine_id,
            m.name AS medicine_name,
            m.unit AS medicine_unit,
            m.image AS medicine_image,
            m.origin AS medicine_origin,
            p.uses AS medicine_uses
            FROM 
                appointments a
            LEFT JOIN 
                users u1 ON a.doctor_id = u1.id
            LEFT JOIN 
                users u2 ON a.patient_id = u2.id AND a.patient_type = 1
            LEFT JOIN 
                users u3 ON a.payment_user_id = u3.id
            LEFT JOIN 
                guests g ON a.patient_id = g.id AND a.patient_type = 2
            LEFT JOIN 
                appointments_infos ai ON a.id = ai.appointment_id
            LEFT JOIN 
                services s ON ai.service_id = s.id
            LEFT JOIN 
                prescriptions p ON a.id = p.appointment_id
            LEFT JOIN 
                medicines m ON p.medicine_id = m.id
            WHERE 
                DATE(a.date) >= '${from}'
            ORDER BY 
                a.date DESC, a.session_time DESC;
            
            `
        }
        if((isEmpty(to) && isEmpty(from)) || to=="no-date" && from=="no-date")
        {
            sql= `SELECT 
            a.*,
            u1.id AS doctor_id,
            CONCAT(u1.full_name) AS doctor_fullName,
            u1.email AS doctor_email,
            u1.avatar AS doctor_avatar,
            CASE
                WHEN a.patient_type = 1 THEN CONCAT(u2.full_name)
                WHEN a.patient_type = 2 THEN CONCAT(g.full_name)
                ELSE NULL
            END AS patient_fullName,
            CASE
                WHEN a.patient_type = 1 THEN u2.id
                WHEN a.patient_type = 2 THEN g.id
                ELSE NULL
            END AS patient_id,
            CASE
                WHEN a.patient_type = 1 THEN u2.email
                WHEN a.patient_type = 2 THEN NULL
                ELSE NULL
            END AS patient_email,
            CASE
                WHEN a.patient_type = 1 THEN u2.avatar
                WHEN a.patient_type = 2 THEN NULL
                ELSE NULL
            END AS patient_avatar,
            CASE
                WHEN a.patient_type = 1 THEN u2.phone
                WHEN a.patient_type = 2 THEN g.phone
                ELSE NULL
            END AS patient_phone,
            CASE
                WHEN a.patient_type = 1 THEN NULL
                WHEN a.patient_type = 2 THEN g.identity_card_number
                ELSE NULL
            END AS patient_identity_card_number,
            CASE
                WHEN a.patient_type = 1 THEN NULL
                WHEN a.patient_type = 2 THEN g.address
                ELSE NULL
            END AS patient_address,
            u3.full_name as payment_user_name,
            u3.email as payment_user_email,
            s.id AS service_id,
            s.name AS service_name,
            s.charge AS service_charge,
            m.id AS medicine_id,
            m.name AS medicine_name,
            m.unit AS medicine_unit,
            m.image AS medicine_image,
            m.origin AS medicine_origin,
            p.uses AS medicine_uses
            FROM 
                appointments a
            LEFT JOIN 
                users u1 ON a.doctor_id = u1.id
            LEFT JOIN 
                users u2 ON a.patient_id = u2.id AND a.patient_type = 1
            LEFT JOIN 
                users u3 ON a.payment_user_id = u3.id
            LEFT JOIN 
                guests g ON a.patient_id = g.id AND a.patient_type = 2
            LEFT JOIN 
                appointments_infos ai ON a.id = ai.appointment_id
            LEFT JOIN 
                services s ON ai.service_id = s.id
            LEFT JOIN 
                prescriptions p ON a.id = p.appointment_id
            LEFT JOIN 
                medicines m ON p.medicine_id = m.id
            ORDER BY 
                a.date DESC, a.session_time DESC;
            `
        }

        db.query(sql, (err, results) => {
            if (err) res.send({result:"Failed",message: err})
            else 
            {
                // console.log("appointments",results)
                if(results.length==0)
                {
                    res.send({result:"okie",data:[]})
                }
                else
                {
                    const formattedAppointments = [];

                    for (const appointment of results) {
                        const {
                        service_id,
                        service_name,
                        service_charge,
                        medicine_id,
                        medicine_name,
                        medicine_unit,
                        medicine_image,
                        medicine_origin,
                        medicine_uses
                        } = appointment;

                        let formattedAppointment = formattedAppointments.find(
                        (item) => item.id === appointment.id
                        );

                        if (!formattedAppointment) {
                            formattedAppointment = {

                                ...appointment,
                                services: [],
                                medicines: []
                            };
                            formattedAppointments.push(formattedAppointment);
                        }

                        if (service_id && service_name && service_charge) {
                            if(!formattedAppointment.services.some(item=>item.id ==service_id))
                            {
                                formattedAppointment.services.push({
                                    id: service_id,
                                    name: service_name,
                                    charge: service_charge
                                });
                            }
                        }

                        if (
                        medicine_id &&
                        medicine_name &&
                        medicine_unit &&
                        medicine_image &&
                        medicine_origin &&
                        medicine_uses
                        ) {
                            if(!formattedAppointment.medicines.some(item=>item.id==medicine_id))
                            {
                                formattedAppointment.medicines.push({
                                    id: medicine_id,
                                    name: medicine_name,
                                    unit: medicine_unit,
                                    image: medicine_image,
                                    origin: medicine_origin,
                                    usage: medicine_uses
                                });
                            }
                        }
                    }
                    res.send({result:"okie",data:formattedAppointments})
                }
            }
            
        })
    },
    reExamine: async (req, res) => {
        let data = req.body;
        // console.log("data",data)
         let userId = req.userId
         data.created_by = userId
         data.updated_by = userId
         let services = data.services
         delete data.services
         console.log("serviceInsert",data)
         let sql = 'INSERT INTO appointments SET ?'
         let childrenId;
         let parent_id = data.parent_id
         db.query(sql, [data], (err, response) => {
             if (err) res.send({message: err, result:"Failed"})
             else {
                console.log(response)
                childrenId = response.insertId
                for (const service of services) {
                    const { id, charge } = service;
                    const queryText = `
                      INSERT INTO appointments_infos ( created_by, updated_by, status, appointment_id, service_id, service_charge)
                      VALUES (?, ?, ?, ?, ?, ?)
                      ON DUPLICATE KEY UPDATE
                      created_by = VALUES(created_by),
                      updated_by = VALUES(updated_by),
                      status = VALUES(status),
                      appointment_id = VALUES(appointment_id),
                      service_id = VALUES(service_id),
                      service_charge = VALUES(service_charge)
                    `;
                    const values = [ userId, userId, 1, response.insertId, id, charge];
              
                    db.query(queryText, values, (err, result) => {
                      if (err) {
                        console.error('Error while inserting or updating appointments_infos:', err);
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
                        console.log('Successfully inserted or updated appointments_infos');
                        let update_sql = 'UPDATE appointments SET children_id = ? WHERE id = ?';
                        db.query(update_sql, [childrenId, parent_id], (err, _response) => {
                            if (err) res.send({result:"Failed", message: "Có lỗi vui lòng liên hệ admin"})
                            else {
                                res.send({result:"okie",message: 'Đặt lịch tái khám thành công' })
                            }
                        })
                    }
                  });
             }
         })
    },
}
