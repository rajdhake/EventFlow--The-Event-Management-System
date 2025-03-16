import { useCallback, useEffect, useState } from "react";


export default function CreateMembershipLogic(teamId) {
  const [teamMembers, setTeamMembers] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
 



  return {
    teamMembers,
    memberCount,
  };
}
