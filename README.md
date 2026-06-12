# Trackher
TrackHer is a smart menstrual wellness companion that combines cycle tracking with AI-driven insights. Designed to empower users with better understanding of their hormonal patterns, TrackHer provides intelligent predictions, symptom analysis, and personalized recommendations all in a secure and user-focused platform.
 ## Setup
  ### Backend 
     cd backend
     npm install express mongoose cors dotenv bcrypt jsonwebtoken
     npm install --save-dev nodemon
     npm install google-auth-library
  ### Frontend
       cd frontend
       npm install 
       npm run dev
       npm install react-router-dom axios
       npm install recharts
       npm install tailwindcss
       npm install -D tailwindcss @tailwindcss/vite
       npm install @react-oauth/google axios

## To Run
  ### Backend
      node sever.js

  ### Frontend 
      npm run dev

 ### Database Setup (MySQL)
   1. Open your MySQL client and run:
      CREATE DATABASE trackher;
      USE trackher;

   2. Create the users table:
      CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          birthdate DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

   3. Create a `.env` file inside the "Trackher/Backend" folder and add:
      PORT=5000
      DB_HOST=localhost
      DB_USER=root
      DB_PASSWORD=YOUR_LOCAL_MYSQL_PASSWORD
      DB_NAME=trackher
