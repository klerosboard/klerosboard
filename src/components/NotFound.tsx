import { Link } from "react-router-dom";
import COURT from '../assets/icons_kleros/kleros.png';

export default function NotFound() {
    return (
        <div>
            <h1>Page Not Found.</h1>
            <p>You seem to be lost.</p>
        
            <Link to='/'>Klerosboard</Link><br></br>
            <img src={COURT} alt="Klerosboard"></img>
        </div>
    )
}