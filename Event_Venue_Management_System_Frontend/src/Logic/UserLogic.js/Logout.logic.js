import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";


function LogoutLogic() {

    const navigate = useNavigate();

    const logout = async (e) => {
    e?.preventDefault();

    };
    return { logout };
}

export default LogoutLogic;
