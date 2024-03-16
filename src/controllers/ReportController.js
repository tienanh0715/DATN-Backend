'use strict'

const moment = require('moment/moment')
const db = require('../db')
const executeQuery = (query) => {
    return new Promise((resolve, reject) => {
      db.query(query, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
module.exports = {
    getAccount: async (req, res) => {
        let sql_count_patient = `SELECT *
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 1
        AND r.code = 'PATIENT';
        `
        let sql_count_doctor = `SELECT *
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 1
        AND r.code = 'DOCTOR';
        `
        let sql_count_staff = `SELECT *
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 1
        AND r.code = 'STAFF';
        `
        let sql_count_guest = `SELECT * from guests WHERE status = 1; `
        let report = {
            patient: 0,
            doctor:0,
            staff:0,
            guest:0
        }
        let passed = true
        await executeQuery(sql_count_patient).then(count=>{report.patient=count?.length});
        if(passed)
        {
        await executeQuery(sql_count_doctor).then(count=>{report.doctor=count?.length});
        }
        if(passed)
        {
            await executeQuery(sql_count_staff).then(count=>{report.staff=count?.length});
        }
        if(passed)
        {
            await executeQuery(sql_count_guest).then(count=>{report.guest=count?.length});
        }
        res.send({result:"okie",data:report})
    },
    getIncome: async (req, res) => {
        let sql = `SELECT * FROM appointments WHERE status=4 AND YEAR(payment_date) = YEAR(CURRENT_DATE)`
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else {
                const currentMonth = new Date().getMonth(); 
                let incomeCurrentMonth = 0
                let incomeYear=0
                let calculateIncomeCurrentMonth = response.map(item=>{
                    if(item.payment_date.getMonth() ==currentMonth)
                    {
                        incomeCurrentMonth+= parseInt(item.payment_amount)
                    }
                    incomeYear += parseInt(item.payment_amount)
                })
                let data = [
                    { id: 1, label: "Doanh thu tháng "+ (currentMonth+1), value: incomeCurrentMonth, color: "#1B998B" },
                    { id: 2, label: "Doanh thu cả năm", value: incomeYear, color: "#17a5ce"},
                ]
                
                res.send({result:"okie",data:data})
            }
        })
    },
    getPatient: async (req, res) => {
        let sql = `SELECT *
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 1
        AND r.code = 'PATIENT'
        LIMIT 5;
        `
        db.query(sql, (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else {
                console.log("res",response)
                res.send({result:"okie",data: response})
            }
        })
      
    },
    getAppointment: async (req, res) => {
        let doctorIds = req.body.doctorIds
        let patientIds = req.body.patientIds
        if(doctorIds.length == 0 || patientIds.length ==0)
        {
            res.send({result:"Failed",message: "Lỗi rồi"})
        }
        else
        {
            const placeholderDoctorIds = doctorIds.map((id) => id).join(", "); // Tạo chuỗi placeholder cho các giá trị
            const placeholderPatientIds = patientIds.map((id) => id).join(", "); // Tạo chuỗi placeholder cho các giá trị
            let sql = `SELECT MONTH(date) AS month,
            COUNT(*) AS total_appointments,
            COUNT(CASE WHEN status IN (3, 4) THEN 1 END) AS examined_appointments
            FROM appointments
            WHERE YEAR(date) = YEAR(CURRENT_DATE)
            AND doctor_id IN (${placeholderDoctorIds})
            AND patient_id in (${placeholderPatientIds}) AND patient_type = 1
            GROUP BY MONTH(date)
            ORDER BY MONTH(date)`;
            db.query(sql, (err, response) => {
                if (err) res.send({result:"Failed",message: err})
                else
                {
                    res.send({result:"okie",data: response})
                }
            })
        }
       
    },
    getAllDoctor:async (req, res) => {
        let sql_count_doctor = `SELECT u.*
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 1
        AND r.code = 'DOCTOR';
        `
        db.query(sql_count_doctor, (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else
            {
                console.log("doctor",response)
                res.send({result:"okie",data:response})
            }
        })
    },
    getAllPatient:async (req, res) => {
        let sql_count_patient = `SELECT u.*
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 1
        AND r.code = 'PATIENT';
        `
        db.query(sql_count_patient, (err, response) => {
            if (err) res.send({result:"Failed",message: err})
            else
            {
                res.send({result:"okie",data:response})
            }
        })
    },
}
