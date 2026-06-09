import { useEffect } from "react";
import { useNavigate } from "react-router"

const withAuth = (WrapedComponent) => {
    const AuthComponent = ( props ) => {
            const router = useNavigate();

            const isAuthenticated = () => {
                if(localStorage.getItem("token")){
                    return true;
                }else{
                    return false;
                }
            }

            useEffect(()=>{
                if(!isAuthenticated()){
                    router("/auth");
                }
            },[])

            return <WrapedComponent { ...props } />
    }
    return AuthComponent
}

export default withAuth;