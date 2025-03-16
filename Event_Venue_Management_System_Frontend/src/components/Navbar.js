import { useEffect, useState } from "react";
import { RiMenu3Line } from "react-icons/ri";
import { NavLink } from "react-router-dom";
import Brand from "./Brand";

function Navbar() {
  const [toggleMenu, setToggleMenu] = useState(false);

  const [navData, setNavData] = useState([]);

  let token = false;

  useEffect(() => {
    
    setNavData((prev) => [
      {
        title: "Explore",
        link: "/explore",
        show: false,
      },
      {
        title: "Dashboard",
        link: "/dashboard",
        show: token ? true : true,
      },
      {
        title: "Login",
        link: "/auth/login",
        show: token ? false : true,
      },
      {
        title: "Signup",
        link: "/auth/signup",
        show: token ? false : true,
      },
    ]);
  }, [token]);


  return (
    <div className="app ">
      <nav className=" text-white w-full bg-secondary text-sm">
        <div className="container">
          <div className="flex mx-auto justify-between ">
            {/* Primary menu and logo */}
            <div className="flex items-center justify-between w-full gap-16 my-8 font-poppins">
              {/* logo */}
              <div>
                <Brand />
              </div>
              {/* primary */}
              <div className="hidden lg:flex gap-8 ">
                {navData?.map(
                  (item, index) =>
                    item.show && (
                      <NavLink
                        onClick={() => setToggleMenu((prev) => false)}
                        key={index}
                        to={item.link}
                        className="hover:text-accent"
                      >
                        {item.title}
                      </NavLink>
                    )
                )}
                {token && <button onClick={console.log("logged out")}>Logout</button>}
              </div>
            </div>
            {/* secondary */}
            <div className="flex gap-6">
              {/* Mobile navigation toggle */}
              <div className="lg:hidden flex items-center">
                <button onClick={() => setToggleMenu(!toggleMenu)}>
                  <RiMenu3Line size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* mobile navigation */}
        <div
          className={`fixed z-40 w-full bg-secondary overflow-hidden flex flex-col lg:hidden gap-12  origin-top duration-700 font-poppins ${
            !toggleMenu ? "h-0" : "h-full"
          }`}
        >
          <div className="px-8">
            <div className="flex flex-col gap-8 tracking-wider">
              {navData?.map(
                (item, index) =>
                  item.show && (
                    <NavLink
                      onClick={() => setToggleMenu((prev) => false)}
                      key={index}
                      to={item.link}
                      className="hover:text-accent"
                    >
                      {item.title}
                    </NavLink>
                  )
              )}
              {token && (
                <button className="logout-btn" onClick={console.log("logged out")}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
