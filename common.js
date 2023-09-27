function loadExternalScript(src) {
    var script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
}

loadExternalScript('https://code.jquery.com/jquery-3.5.1.slim.min.js');
loadExternalScript('https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js');
loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js');
loadExternalScript('https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js');