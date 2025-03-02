(document.getElementById("logout") as HTMLAnchorElement).addEventListener("click", async () => {
    document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });

    const username: string = localStorage.getItem("username") || "";
    if (username !== "") {
        await axios.delete(`/user/logout/${username}`)
                .then((response) => {
                    localStorage.removeItem("username");
                    window.location.href = "/";
                })
                .catch((error) => {

                });
    }
});
