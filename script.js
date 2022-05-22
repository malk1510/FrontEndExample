import img_arr from "./data.js";

let mouse_change_img = function (){
    if(curr_container.id == this.id)
        return;
    curr_container.classList.remove("blue");
    this.classList.add("blue");
    curr_container = this;
    curr_img = img_arr[parseInt(curr_container.id)-1];
    document.getElementById("main_image").src = curr_img['previewImage'];
    document.querySelector(".editableText").innerText = curr_img['title'];
}

let up_key_change_img = function(event){
    console.log(event);
    if(curr_container.id != 1){
        let new_id = parseInt(curr_container.id) - 1;
        curr_container.classList.remove("blue");
        curr_container = document.getElementById(`${new_id}`);
        curr_container.classList.add("blue");
        curr_img = img_arr[parseInt(curr_container.id) - 1];
        document.getElementById("main_image").src = curr_img['previewImage'];
        document.querySelector(".editableText").innerText = curr_img['title'];
    }
}

let down_key_change_img = function(event){
    if(curr_container.id != 5){
        let new_id = parseInt(curr_container.id) + 1;
        curr_container.classList.remove("blue");
        curr_container = document.getElementById(`${new_id}`);
        curr_container.classList.add("blue");
        curr_img = img_arr[parseInt(curr_container.id) - 1];
        document.getElementById("main_image").src = curr_img['previewImage'];
        document.querySelector(".editableText").innerText = curr_img['title'];
    }
}

let change_text = function() {
    console.log(event);
    curr_img['title'] = this.innerText;
    curr_container.querySelector(".caption").innerText = shorten_text(curr_img['title']);
}

let shorten_text = function(text) {
    if(text.length > 32){
        text = text.substring(0,15) + "..." + text.substring(text.length-14);
    }
    return text;
}

let check_key = function() {
    console.log(event.code);
    if(event.code == "ArrowDown"){
        down_key_change_img(event);
    }
    else if(event.code == "ArrowUp"){
        up_key_change_img(event);
    }
    return;
}

let curr_img = img_arr[0];
document.body.innerHTML = `
<div class = "content">
<div class = "columnLeft" id = "left_col">
    <ul class = "leftList"></ul>
</div>
<div class = "columnRight" id = "right_col">
    <img id="main_image" src = "${curr_img["previewImage"]}">
    <div class = "editableText" contentEditable = "true"> ${curr_img["title"]} </div>
</div>
</div>
`;
let text_op = ``;
for(let i=0; i<5; i++){
    text_op += `<li class = "listElement" id="${i+1}"> <img align="middle" class="small_image" src = "${img_arr[i]['previewImage']}"> <span class = "caption">${shorten_text(img_arr[i]['title'])}</span></li>`;
}
document.querySelector(".leftList").innerHTML = text_op;
let curr_container = document.getElementById('1');

for(let i=0; i<5; i++){
    document.getElementById(`${i+1}`).addEventListener('click', mouse_change_img);
}

document.querySelector(".editableText").addEventListener('input', change_text);
document.addEventListener("keydown", check_key);
