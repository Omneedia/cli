<script type="text/javascript" src="/socketcluster-client.js"></script>
<script type="text/javascript">

    var socket = socketClusterClient.create();

    (async () => {
    let channel = socket.subscribe("dev");
    for await (let data of channel) {
        if (data == "reload") location.reload();
    }
    })();

    (async () => {
    for await (let { error } of socket.listener("error")) {
        console.error(error);
        window.setTimeout(location.reload, 2000);
    }
    })();
    (async () => {
        let channel = socket.subscribe("dev");
        for await (let data of channel) {
          if (data == "reload") return window.location.reload(true);
        }
    })();
    (async () => {
    for await (let event of socket.listener("connect")) {
        console.log("Socket is connected");
        console.log(socket);
        var sid = localStorage.getItem("sid");
        if (sid != socket.id) {
        localStorage.setItem("sid", socket.id);
        }
    }
    })();
</script>