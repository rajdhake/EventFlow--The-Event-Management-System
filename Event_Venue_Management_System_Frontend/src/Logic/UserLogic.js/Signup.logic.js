import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";


function SignupLogic() {
  const port = 3000;
  const signIn_URL = "http://localhost:"+port+"/users/register";
  const logIn_URL = "http://localhost:"+port+"/users/login";

  const [showPass, setShowPass] = useState(false);
  const [showCPass, setShowCPass] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [CPassword, setCPassword] = useState("");
  const [role, setRole] = useState("");
  const [validateMessage, setValidateMessage] = useState(null);
  const [signingin, setSigningin] = useState(false);

  const navigate = useNavigate();

  const inputs = [
    {
      label: "Name",
      name: "name",
      placeholder: "John Doe",
      value: name,
      cb: setName,
      required: true,
    },
    {
      label: "Email",
      name: "email",
      placeholder: "example@email.com",
      value: email,
      type: "email",
      cb: setEmail,
      required: true,
    },
    {
      label: "Password",
      name: "password",
      placeholder: "Please pick a strong password",
      value: password,
      cb: setPassword,
      type: !showPass ? "password" : "text",
      required: true,
      rightIcon: (
        <button
          onClick={(e) => {
            e?.preventDefault();
            setShowPass((prev) => !prev);
          }}
        >
          {showPass ? (
            <AiOutlineEye size={24} />
          ) : (
            <AiOutlineEyeInvisible size={24} />
          )}
        </button>
      ),
    },
    {
      label: "Confirm Password",
      placeholder: "Please retype password",
      name: "cpassword",
      value: CPassword,
      cb: setCPassword,
      required: true,
      type: !showCPass ? "password" : "text",
      rightIcon: (
        <button
          onClick={(e) => {
            e?.preventDefault();
            setShowCPass((prev) => !prev);
          }}
        >
          {showCPass ? (
            <AiOutlineEye size={24} />
          ) : (
            <AiOutlineEyeInvisible size={24} />
          )}
        </button>
      ),
    },
    {
      label: "Role",
      placeholder: "Customer",
      value: role,
      cb: setRole,
      keyboard: "default",
      defaultValue: "Customer",
      options: [{
          value: "customer",
          label: "Customer",
        },
        {
          value: "venueOwner",
          label: "Venue Owner",
        },
        {
          value: "eventPlanner",
          label: "Event Planner",
        },
        {
          value: "Admin",
          label: "Admin",
        },
      ]
    },
  ];

  const navigateToPhone = (e) => {
    e?.preventDefault();
    navigate("/auth/phone")
  }

  const signUpUser = async (e) => {
    console.log(e);
    console.log(role);
    e?.preventDefault();
    if (!name || !email || !password || !CPassword || !role) {
      toast.error("Please fill all fields");
      setValidateMessage((prev) => "Please fill all fields");
      return;
    }
    if (password !== CPassword) {
      toast.error("Passwords do not match");
      setValidateMessage((prev) => "Passwords do not match");
      return;
    }
    setSigningin((prev) => true);
    setValidateMessage((prev) => null);

    const data = {
        name: name,
        email: email,
        role: role,
    }

    try{
      const addUserResponse = await fetch(signIn_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/JSON"},
      })
      const logInUserResponse = await fetch(logIn_URL,{
        method:'POST',
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/JSON"},
      })

      //add token

      toast.success("Signed up successfully");

      navigate("/auth/phone", {
        replace: true,
        state: {
          ...logInUserResponse,
          email,
          password
        }
      });

    }
    catch (error){
        setValidateMessage((prev) => error.message);
        toast.error(error.message);
        return;
    }
    finally{
        setSigningin((prev) => false);
    }

    
    
  };

  return {
    inputs,
    validateMessage,
    signingin,
    setSigningin,
    setValidateMessage,
    showPass,
    setShowCPass,
    showCPass,
    setShowPass,
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    CPassword,
    setCPassword,
    signUpUser,
    navigateToPhone
  };
}

export default SignupLogic;