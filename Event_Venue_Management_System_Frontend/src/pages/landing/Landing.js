import { useRef } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import ExploreEventCard from "../../components/ExploreEventCard";
import {
  IoArrowBack,
  IoArrowForward,
} from "react-icons/io5";





function Landing() {

  const swiperRef = useRef(null);

  

  const testEvent1 = [ //remove once getEvents is done
    "The Nashville House",
    "Catering",
    "../assets/images/Test1.jpg",
    1,
    "February 20",
  ]

  const events = [testEvent1]; //replace in function for getEvents()

  const token = false; //replace with token


  return (
    <div className="flex-1 bg-white font-poppins select-none">
      <div className="bg-secondary">
        <section className="flex flex-col text-center w-full items-center py-8 lg:py-16 justify-center gap-8 md:gap-0 container min-h-[75vh] relative">
          <div
            className="flex flex-col gap-4 items-center justify-center z-10"
            style={{ flexBasis: "50%" }}
          >
            <h1 className=" text-2xl md:text-4xl lg:text-6xl text-slate-100 font-bold leading-relaxed lg:leading-normal drop-shadow-2xl">
              Motto Line 1
              <br />
              Motto Line 2
            </h1>
            <p className=" md:max-w-[90%] py-4 text-slate-400">
              RSVP and Management Made Effortless for Creators
            </p>
            <div className="inline-flex items-center gap-2">
              <Link
                to={token ? "/dashboard" : "/auth/signup"}
                className="bg-gradient-to-b shadow-xl focus:ring-accent from-accent to-accent/90 rounded-full p-4 text-white text-center"
              >
                {token ? "Go to Dashboard" : "Get Started"}
              </Link>
              <Link
                to={"/explore"}
                className="bg-gradient-to-r shadow-xl from-primary to-primary/90 rounded-full p-4 text-white text-center"
              >
                Explore Events
              </Link>
            </div>
          </div>
          <div className=" w-full relative"></div>
        </section>
      </div>
      <div className="inline-flex items-center w-full justify-between">
        <h1 className="page-title">{"All"} Events</h1>
        <div className="inline-flex text-primary gap-4 justify-end items-center">
          <button
            onClick={() => {
              swiperRef.current.swiper.slidePrev();
            }}
          >
            <IoArrowBack />
          </button>
          <button
            onClick={() => {
              swiperRef.current.swiper.slideNext();
            }}
          >
            <IoArrowForward />
          </button>
        </div>
      </div>
      <div>
        <Swiper
          className="event-swiper"
          ref={swiperRef}
          modules={[Navigation]}
          slidesPerView={1}
          spaceBetween={20}
          breakpoints={{
            360: {
                slidesPerView: 1,
            },
            560: {
                slidesPerView: 2,
            },
            640: {
              slidesPerView: 3,
            },
            820: {
              slidesPerView: 4,
            }
          }}
        >
          {events?.map((item) => (
            <SwiperSlide>
              <ExploreEventCard {...item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>

  );
}

export default Landing;
