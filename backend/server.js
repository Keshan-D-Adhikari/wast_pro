//const express = require('express');
 
import express from"express";


const app = express();

app.listen(5001, () => {


    app.get('/', (req, res) => {
        res.send('Hello World!');
    });

        console.log('Server is running on port 5001');
});