import React from "react";
import { Link } from "react-router-dom";

function ExploreEventCard(event){

    const title = event[0]
    const category = event[1]
    const image = event[2]
    const $id = event[3]
    const startDate = event[4]

  return <Link to={`/event/${$id}`} className="w-full">
        <div className="relative">
            <img
                src={image}
                alt={title}
                className="object-cover w-full rounded-lg aspect-video"
            />
            <div className="absolute m-2 rounded text-sm top-0 right-0 text-center font-semibold bg-white shadow p-2">
                <h3>{startDate}</h3>
            </div>
            <div className="absolute m-2 rounded text-xs bottom-0 left-0 text-center bg-white shadow p-2">
                <p>{category}</p>
            </div>
        </div>
        <div className="py-4 space-y-2">
            <h1 className="font-bold">{title}</h1>
            {/* <p className="text-sm text-gray-500 line-clamp-3">{description}</p> */}
        </div>
  </Link>;
}

export default ExploreEventCard;
