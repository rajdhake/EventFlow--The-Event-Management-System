import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function OtpLogic() {
  const [validateMessage, setValidateMessage] = useState(null);
  const [signingin, setSigningin] = useState(false);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [timeString, setTimeString] = useState("");

  const navigate = useNavigate();
  const {state} = useLocation()
  const { userId, phone, expire } = state;

  
  const inputs = [
    {
      label: "OTP",
      placeholder: "Please enter OTP",
      value: otp,
      cb: setOtp,
      type: "number",
      required: true,
    },
  ];

  useEffect(() => {
    setTimeLeft(prev => (new Date(expire?.split(' ').join('+')).getTime() - new Date().getTime()));
    setTimeString((prev) => {
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return `${minutes <=9 ? '0' : ''}${minutes}:${seconds <=9 ? '0' : ''}${seconds}`;
    });
  }, [expire]);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1000);
        setTimeString((prev) => {
          const minutes = Math.floor(
            (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          return `${minutes <=9 ? '0' : ''}${minutes}:${seconds <=9 ? '0' : ''}${seconds}`;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  const updatePhoneVerificationStatus = async (e) => {
    e?.preventDefault();
    setSigningin((prev) => true);
    setValidateMessage((prev) => null);
  
  };

  const resendCode = async () => {
  }

  return {
    inputs,
    validateMessage,
    signingin,
    setSigningin,
    setValidateMessage,
    updatePhoneVerificationStatus,
    timeLeft,
    timeString,
    phone,
    resendCode
  };
}

export default OtpLogic;
