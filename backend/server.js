//const express = require('express');
 
import express from"express";
import dotenv from "dotenv";

dotenv.config();


const app = express();
const PORT=process.env.PORT || 5001;

connectDB(process.env.DATABASE_URL);


app.get('/', (req, res) => {
        res.send('Hello World!');
    });


app.listen(5001, () => {

console.log('Server is running on port  : ',PORT);

});