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
            WHEN a.patient_type = 2 THEN NULL
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
        u3.avatar as payment_user_avatar
        FROM appointments a
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
        WHERE a.status IN (3, 4)
        ORDER BY 
            a.status asc, a.payment_date desc, a.date desc, a.session_time desc;
        `
        
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

                        let formattedAppointment = formattedAppointments.find(
                        (item) => item.id === appointment.id
                        );

                        if (!formattedAppointment) {
                            formattedAppointments.push(appointment);
                        }
                    }
                    res.send({result:"okie",data:formattedAppointments})
                }
            }
            
        })
    },
    detail: async (req, res) => {
        let serviceId = req.params.id;
        let sql = `SELECT * FROM appointments WHERE id=${serviceId}`
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: response})
            console.log("serviceDetail",response)
            if(response.length==0)
            {
                res.send({result:"Failed",data:{}})
            }
            res.send({result:"okie",data:response[0]})
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
            WHEN a.patient_type = 2 THEN NULL
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
        u3.avatar as payment_user_avatar
        FROM appointments a
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
        WHERE 
            DATE(a.date) <= '${to}'
            AND DATE(a.date) >= '${from}'
            AND a.status IN (3, 4)
        ORDER BY 
            a.status asc, a.payment_date desc, a.date desc, a.session_time desc;
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
              WHEN a.patient_type = 2 THEN NULL
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
          u3.avatar as payment_user_avatar
          FROM appointments a
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
            WHERE 
                DATE(a.date) <= '${to}'
                AND 
                a.status IN (3, 4)
            ORDER BY 
                a.status asc, a.payment_date desc, a.date desc, a.session_time desc;
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
                WHEN a.patient_type = 2 THEN NULL
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
            u3.avatar as payment_user_avatar
            FROM appointments a
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
            WHERE 
                DATE(a.date) >= '${from}' AND a.status IN (3, 4)
            ORDER BY 
                a.status asc, a.payment_date desc, a.date desc, a.session_time desc;
            
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
                WHEN a.patient_type = 2 THEN NULL
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
            u3.avatar as payment_user_avatar
            FROM appointments a
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
            WHERE a.status IN (3, 4)
            ORDER BY 
                a.status asc, a.payment_date desc, a.date desc, a.session_time desc;
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

                        let formattedAppointment = formattedAppointments.find(
                        (item) => item.id === appointment.id
                        );

                        if (!formattedAppointment) {
                            formattedAppointments.push(appointment);
                        }
                    }
                    res.send({result:"okie",data:formattedAppointments})
                }
            }
            
        })
    },
}
