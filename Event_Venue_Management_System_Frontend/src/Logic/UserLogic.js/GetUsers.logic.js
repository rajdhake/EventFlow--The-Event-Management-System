import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";


function GetUsersLogic() {
    const [users,setUsers] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showUsers, setShowUsers] = useState(null)
    
    const toggleShowUsers = useCallback(() => {
        setShowUsers(prev => !prev)
    }, [])


    return {
        users,
        showUsers,
        loading,
        error,
        toggleShowUsers
    }
}

export default GetUsersLogic;