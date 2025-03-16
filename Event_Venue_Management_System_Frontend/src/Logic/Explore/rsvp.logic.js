import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNotifications } from "../../context/notificationContext";

export default function RsvpLogic(event) {
  const token = JSON.parse(localStorage.getItem("token"));
  const cookieFallback = JSON.parse(localStorage.getItem("cookieFallback"));
  const spotlightUser = JSON.parse(localStorage.getItem("spotlight-user"));
  

  const [adding, setAdding] = useState(false);

  const { sendNotification } = useNotifications();

  const checkUserIsOwner = () => {
    if (token && cookieFallback && spotlightUser) {
      if (event?.createdBy === spotlightUser?.$id) {
        return true;
      }
    }
    return false;
  };

    

  const approveRsvp = async (user) => {
    const {teamId, userId, name, email, documentId, eventName, eventId} = user;
  }

  const rejectRsvp = async ( user ) => {
    const {teamId, userId, documentId, eventName, membershipId} = user;
    
  }
 
  const handleRSVP = async (e) => {
    e.preventDefault();
    if (checkUserIsOwner()) {
      toast.error("You cannot RSVP to your own event");
      return;
    }
    if (!token || !cookieFallback) {
      toast.error("Please login to RSVP");
      return;
    }

    if(event?.acceptingRsvp === false) {
      toast.error("RSVP for this event is closed");
      return;
    }

  };

  return {
    token,
    cookieFallback,
    handleRSVP,
    checkUserIsOwner,
    adding,
    approveRsvp,
    rejectRsvp
  };
}
