//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_CONNECT_URI, {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to todoList"
});

const item2 = new Item ({
  name: "Hit + Button to add a new item"
});

const item3 = new Item ({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({}, function(err, results){
    if (results.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully added the lists");
        }
        res.redirect("/");
      });
    } else {
        res.render("list", {listTitle: "Today", newListItems: results});
    }
  });
});

app.get("/:otherparams", function(req, res){
  const otherparams = _.capitalize(req.params.otherparams);
  List.findOne({name: otherparams}, function(err, foundresults){
    if(!err){
      if(!foundresults){
        const list = new List({
          name: otherparams,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + otherparams);
      } else {
        res.render("list", {listTitle: foundresults.name, newListItems: foundresults.items})
      }
    }
  });

});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;

  const additem = new Item ({
    name: item
  });

  if(listName === "Today"){
    additem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundresults){
      foundresults.items.push(additem);
      foundresults.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkboxItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkboxItem, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully Deleted");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkboxItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }
});



// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });
//
// app.get("/about", function(req, res){
//   res.render("about");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
