import mongoose from "mongoose"

export const dbConnect = () => {
    try {
        const connect = mongoose.connect(process.env.MONGODB_URL);
        
        console.log('Database connected');
    } catch (error) {
        console.log(error);
    }
}