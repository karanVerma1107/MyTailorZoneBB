import nodemailer from 'nodemailer'

const sendEmail = async (options)=>{

    const transporter = nodemailer.createTransport({
        service: process.env.SMPT_SERVICE,
        host:process.env.SMPT_HOST,
        port:process.env.SMPT_PORT,
        secure:true,
        logger:true,
        secureConnection:false,
        auth:{
    
            user:process.env.SMPT_MAIL,
            pass:process.env.SMPT_PASSWORD,
        },
        tls:{
            rejectUnauthorized:true
        }
    
    });
    
    const mailOptions = {
    
        from:"emailstester32@gmail.com",
        to:options.email,
        subject: options.subject,
        text: options.text,
    }
    
    await transporter.sendMail(mailOptions);
    
    }
    
    export default sendEmail;  