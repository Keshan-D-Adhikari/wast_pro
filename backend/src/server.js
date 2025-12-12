import express from 'express';
const app = express();


app.get('/api/health',(req,res) => {

res.status(200).json({ message:"success" });
});


app.listen(3000, () => console.log("Server is up and running port 3000"));
