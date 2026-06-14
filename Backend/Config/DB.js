const mysql =require("mysql2/promise");

require("dotenv").config();
const pool = mysql.createPool({
    uri: process.env.TIDB_URL,
    ssl: {
        rejectUnauthorized: true
    }
});
async function connectDB (){
    try {
        const connection = await pool.getConnection();
        console.log("Connected to the database");
        connection.release();
    } catch (error) {
        console.error("Error connecting to the database", error);
    }
}
module.exports ={connectDB};