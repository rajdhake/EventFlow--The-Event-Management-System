import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function GetEvents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { id } = useParams();
    const {pathname} = useLocation();
    const filter = searchParams.get("filter");
    const [events, setEvents] = useState(null)
    const [eventCount, setEventCount] = useState(null)
    const [privateEvent, setPrivateEvent] = useState(null)
    const [publicEvent, setPublicEvent] = useState(null)
    const [offlineEvent, setOfflineEvent] = useState(null)
    const [onlineEvent, setOnlineEvent] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)






  return {
    loading, error, events, eventCount, privateEvent, publicEvent, offlineEvent, onlineEvent, filter, id, setSearchParams, searchParams
  };
}
export default GetEvents;
