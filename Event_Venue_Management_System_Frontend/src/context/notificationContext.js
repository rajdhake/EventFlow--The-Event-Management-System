import { createContext, useCallback, useContext, useEffect, useState } from "react";

import NotificationSound from '../assets/notification.mp3'

const NotificationContext = createContext();

export default function NotificationProvider({ children }) {
    
    const [show, setShow] = useState(false);
    const [notifications, setNotifications] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const toggleNotificationBar = (e) => {
        e?.preventDefault();
        setShow(prev => !prev);
        setUnreadNotifications(prev => 0);
    }


    const uniqueArray = a => [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s))

    

    const value = {
        show,
        toggleNotificationBar,
        notifications,
        unreadNotifications
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    return useContext(NotificationContext);
}