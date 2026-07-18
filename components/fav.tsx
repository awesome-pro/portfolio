import Image from "next/image";

function Fav() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="text-primary font-semibold">My Favorite Pic</h1>
            <Image src="/fav.png" alt="Abhinandan" width={1000} height={48} className="shadow-xl rounded-3xl" />
        </div>
    );
}

export default Fav;