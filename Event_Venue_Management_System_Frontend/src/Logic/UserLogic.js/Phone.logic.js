import { useEffect, useState } from "react"
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

function PhoneLogic() {
  const [phone, setPhone] = useState("");
  const [validateMessage, setValidateMessage] = useState(null);
  const [signingin, setSigningin] = useState(false);
  const [phoneCode, setPhoneCode] = useState(null);

  const { state } = useLocation();
  
  
  
  const navigate = useNavigate();

  const { email, password, countryCode } = state;
  

  

  const inputs = [
    {
      label: "Phone Number",
      placeholder: "1234567890",
      value: phone,
      cb: setPhone,
      type: "number",
      required: true,
    },
  ];

  const updatePhoneNumber = async (e) => {
    e?.preventDefault();
    setSigningin((prev) => true);
    setValidateMessage((prev) => null);
    
  };

  return {
    inputs,
    validateMessage,
    signingin,
    setSigningin,
    setValidateMessage,
    updatePhoneNumber,
    phoneCode,
  };
}

export default PhoneLogic;
