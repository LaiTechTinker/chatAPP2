const Jwt=require('jsonwebtoken');
const  generateToken=(id)=>{
    return Jwt.sign({id},process.env.SECRET, {expiresIn:"30d"})
}
module.exports=generateToken