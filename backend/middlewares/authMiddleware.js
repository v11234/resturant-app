import jwt from "jsonwebtoken";
export const protect=(req,res,next)=>{
   const token=req.cookies.token;
   if(!token){
      return res.status(401).json({message:"Not Authorized",success:false})
   }
   try {
      const decoded=jwt.verify(token,process.env.JWT_SECRET);
      req.user=decoded;
      next();
   } catch (error) {
      res.status(401).json({ message: "Invalid token" });
   }
}

export const adminOnly=(req,res,next)=>{
   const token=req.cookies.token;
    if(!token){
      return res.status(401).json({message:"Not Authorized",success:false})
   }
   try {
      const decoded=jwt.verify(token,process.env.JWT_SECRET);
      req.admin=decoded;
      const isAdminEmail =
        req.admin?.email && req.admin.email === process.env.ADMIN_EMAIL;
      const isAdminRole = req.admin?.role === "admin";
      if (isAdminEmail || isAdminRole) {
        return next();
      }
      return res
        .status(403)
        .json({ message: "Forbidden", success: false });
   } catch (error) {
           res.status(401).json({ message: "Invalid token" });
   }
}
