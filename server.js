import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer"
import Album from "./Model/Album.js";
import {fileURLToPath} from "url"
import path from "path"

const app = express();

//* MongoDB connection
try {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
}

//* Middleware setup
app.use(express.json());
app.use(cors());


//! absolute path to /server.js
const __filename = fileURLToPath(import.meta.url)
console.log(__filename);


//! alsolute path to folder /root 
const __dirname = path.dirname(__filename)
console.log(__dirname);


app.use(express.static(path.join(__dirname, "frontend/dist")))


//* Multer config
//? Our goal: Create a middleware function `upload()` using multer to parse the incoming file (from the client side) and save it on disk!

//* Storage setup
// multer.diskStorage(): Tells multer to store the uploaded files on disk (instead of memory). => We get a full control over where and how the files are saved

//* Two main storage options
// 	destination: A function that tells multer where to save the file
//	filename: A function that defines what to name the file when saving

let storage

//! changing to between dev and dist mode using env file
if (process.env.NODE_MODE === "development") {    
    storage = multer.diskStorage({
        destination: (req,file,callback)=>{
            callback(null, "frontend/public")
        },
        filename: (req,file,callback)=>{
            callback(null, file.originalname.slice(0,3)+Date.now().toString().slice(-5))
        }
})
} else {
    storage = multer.diskStorage({
        destination: (req,file,callback)=>{
            callback(null, "frontend/dist")
        },
        filename: (req,file,callback)=>{
            callback(null, file.originalname.slice(0,3)+Date.now().toString().slice(-5))
        }
})
}



//* Declare a `upload` middleware function
const upload = multer({
    storage: storage,
    limits: {fileSize: 150 * 1024},//limitation of file that is comming in 
    fileFilter: (req, file, callback) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg"
        ]
        allowedTypes.includes(file.mimetype) && 
        callback(null, true) 
    } //photos allowed data types
})



// app.get("*", async(req,res)=> {
//     res.sendFile(__dirnaame + "/frontend/dist/index.html")
// })

//* Routes
//? GET /albums - fetch all albums
app.get("/albums", async (req,res,next)=> {
    try {
        const album = await Album.find()
        res.status(200).json(album)
    } catch (error) {
        next({error})
    }
})



//? DELETE /delete:id - Delete album by ID
app.delete("/delete/:id", async (req,res,next) => {
    try {
        const {id} = req.params
        await Album.findByIdAndDelete(id)
        res.status(201).json("Album deleted")
    } catch (error) {
        next(error)
    }
})


//? POST /add - Add new album
app.post("/add", upload.single("jacket"), async (req,res,next) => {
    try {
        const newAlbum = new Album({
            ...req.body,
            jacket: req.file?.filename
        })
        console.log(req.file.filename);
        
        await newAlbum.save()

        res.status(200).json(newAlbum)
    } catch (error) {
        next(error)
    }
})





//? PATCH /update:id - Update album image 
app.patch("/update/:id", upload.single("jacket") ,async (req,res,next) => {
    try {
        const {id} = req.params
        const currentAlbum = await Album.findById(id)
        currentAlbum.jacket = req.file?.filename
        await currentAlbum.save()
        res.status(200).json(currentAlbum)
    } catch (error) {
        next(error)
    }
})






//* Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));