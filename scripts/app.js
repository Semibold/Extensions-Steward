(function () {
    
    var config = {
        buffer: "chrome.extensions.buffer",
        status: "chrome.extensions.status"
    };
    
    var status = JSON.parse(localStorage.getItem(config.status) === null ? true : localStorage.getItem(config.status));
    var buffer = JSON.parse(localStorage.getItem(config.buffer)) || [];
    var controller = document.getElementById("controller");
    
    function renderer() {
        chrome.management.getAll(function (result) {
            var h1 = document.createElement("h1");
            var ul = document.createElement("ul");
            
            h1.innerHTML = chrome.i18n.getMessage(status ? "onekeydisable" : "onekeyenable");
            h1.addEventListener("click", status ? disableAll : enableAll);
            h1.setAttribute("data-status", status);
            
            result.forEach(function (element) {
                
                // 扩展自身和主题不显示在管理列表中
                if (element.name === chrome.i18n.getMessage("extname") || element.type === "theme") {
                    return;
                }
                
                var li = document.createElement("li");
                var img = document.createElement("img");
                var span = document.createElement("span");
                
                img.alt = element.name;
                // 避免某些不规范的扩展, 因没有提供图标而导致抛错
                // Todo: 可以提供一张默认图片, 由开发者本人来决定吧
                img.src = element.icons && element.icons.length > 0 ? element.icons[0].url: "";

                span.innerHTML = element.name;
                li.title = chrome.i18n.getMessage(element.enabled ? "leftclicktodisablethis" : "leftclicktoenablethis");
                li.id = element.id;
                li.setAttribute("data-enabled", element.enabled);
                li.appendChild(img);
                li.appendChild(span);
                li.addEventListener("click", changeItem);
                
                ul.appendChild(li);
            });
            
            controller.innerHTML = "";
            controller.appendChild(h1);
            controller.appendChild(ul);
        });
    }
    
    
    
    function disableAll() {
        chrome.management.getAll(function (result) {
            result.forEach(function (element) {
                if (element.name !== chrome.i18n.getMessage("extname") && element.type !== "theme" && element.enabled) {
                    chrome.management.setEnabled(element.id, false);
                    buffer.push(element.id);
                }
            });
            
            status = false;
            localStorage.setItem(config.status, JSON.stringify(status));
            localStorage.setItem(config.buffer, JSON.stringify(buffer));
            renderer();
        });
    }
    
    function enableAll() {
        buffer.forEach(function (element) {
            chrome.management.setEnabled(element, true);
        });
        
        status = true;
        buffer = [];
        localStorage.setItem(config.status, JSON.stringify(status));
        localStorage.setItem(config.buffer, JSON.stringify(buffer));
        renderer();
    }
    
    function changeItem() {
        chrome.management.get(this.id, function (result) {
            chrome.management.setEnabled(result.id, !result.enabled, renderer);
        });
    }
    
    renderer();
    
})();


window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});
