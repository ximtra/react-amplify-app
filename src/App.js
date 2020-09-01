import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
 <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
    <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">


    <script type="text/javascript" src="https://s3.ap-south-1.amazonaws.com/149km/vis.js"></script>
    <link href="https://s3.ap-south-1.amazonaws.com/149km/vis-network.min.css" rel="stylesheet" type="text/css" />

    <script type="text/javascript">
        var PROXY_API_URL = "https://aeoerxajue.execute-api.us-east-1.amazonaws.com/test";
        // var nodes = null;
        var edges = null;
        var network = null;
        var resp =null;
        var options =null;

        var searchfill=null;

        var LENGTH_MAIN = 350,
            LENGTH_SERVER = 150,
            LENGTH_SUB = 50,
            WIDTH_SCALE = 2,
            GREEN = 'green',
            RED = '#C5000B',
            ORANGE = 'orange',
            //GRAY = '#666666',
            GRAY = 'gray',
            BLACK = '#2B1B17';



        $(document).ready(function(){

            console.log('Initializing the page..and loading the values in the Search LoV');
            $.get(PROXY_API_URL + "/initialize", function(data) {
                    console.log(data);
                    var js=JSON.parse(JSON.stringify(data))
                    searchfill=[];
                    for(i=0;i< js.length; i++)
                    {
                        searchfill.push(js[i].name);
                    }
                    console.log(searchfill);

                    $( "#users" ).autocomplete({
                        source:
                            function (request, response) {
                                var filteredArray = $.map(searchfill, function (item) {
                                    //console.log(item);
                                    if (item.startsWith(request.term)) {
                                        return item;
                                    }
                                    else {
                                        return null;
                                    }
                                });
                                response(filteredArray);
                            }
                    });

                }
            );

            $( "#Go" ).click(function(event){
                var username = $("#users").val();
                var lastchar= username.substring(username.length-1, username.length);
                var nextletter= String.fromCharCode(lastchar.charCodeAt(0)+1);
                var touser = username.substring(0,username.length-1)
                touser = touser+nextletter;

                $.get(PROXY_API_URL + "/search?username="+username+"&touser="+touser, function(data) {
                    var resp = JSON.parse(JSON.stringify(data));
                    console.log(resp);
                    var x=0;
                    var y=0;
                    for(let i=0;i< resp.length;i++) {
                        try {
                            nodes.add({id:resp[i].id, label:resp[i].name[0], value:resp[i].label, color: 'red', font: {color:'white'}});
                        }
                        catch (e) { //if node is already added just continue
                            //throw e;
                            nodes.remove({id:resp[i].id });
                            nodes.add({id:resp[i].id, label:resp[i].name[0], value:resp[i].label, color: 'red', font: {color:'white'}});
                        }
                    }
                });

            });
            draw();

        });

        // Called when the Visualization API is loaded.
        function draw() {
            resp = "";
            console.log('Inside draw function to render graph elements (nodes/edges)...');

            // Create a data table with nodes.
            nodes = []; //this will be converted to an object below
            // Create a data table with links.
            edges = []; //this will be converted to an object below

            nodes = new vis.DataSet();
            //handle events on "nodes" object that is added to network
            //for e.g. add a node to the "nodes" object invokes this event
            nodes.on("*", function (event) {
                //document.getElementById('nodes').innerHTML = JSON.stringify(nodes.get(), null, 4);
                //console.log('you just added on a node... :');
                //console.log(event);
            });

            edges = new vis.DataSet();
            var container = document.getElementById('mynetwork');
            var data = {
                nodes: nodes,
                edges: edges
            };

            //options = { };

            options = {
                nodes: {
                    shape: 'box'
                }
            };

            network = new vis.Network(container, data, options);
            network.on("click", function (params) {
                params.event = "[original event]";
                console.log('click event, getNodeAt returns: ' + this.getNodeAt(params.pointer.DOM));
                console.log(this);
                var fromnode = this.getNodeAt(params.pointer.DOM);

                if (typeof nodes.get(fromnode).value != "undefined") {
                    console.log(nodes.get(fromnode).value);

                    getKnowledgeOf(fromnode, nodes, edges);

                    callneptunegettweets(fromnode, nodes, edges);

                    if (nodes.get(fromnode).value == 'person') {
                        console.log('getting user who like this tweet now............');
                        whichusersliketweet(fromnode, nodes, edges);
                    }
                }


            });
        }


        function whichusersliketweet(fromnode, nodes, edges)
        {
            console.log('inside whichusersliketweet');
            $.get(PROXY_API_URL + "/whichusersliketweet?tweetid="+fromnode, function(data) {
                console.log(data);
                var resp = JSON.parse(JSON.stringify(data));
                console.log(resp);
                for(let i=0;i< resp.length;i++) {
                    try {
                        nodes.add({id:resp[i].id, label:resp[i].name[0], value:resp[i].label});
                    }
                    catch (e) { //if node is already added just continue
                        console.log('clicked on the same node twice');
                    }
                }

                console.log('creating user-likes-tweet relations');

                for(let j=0;j< resp.length;j++)
                {
                    console.log('adding edges');
                    try{
                        edges.add({id: resp[j].id+''+fromnode, from: resp[j].id, to: fromnode, label:"likes",
                            color:{color:'rgba(229,77,159,0.78)', highlight:'rgba(229,77,159,0.78)', inherit: false},
                            arrows: {to: {enabled: true } }
                        });
                    } //add an edge
                    catch(e)
                    {
                        console.log('clicked on the same node twice');
                    }
                }
            });

        } //end of function

        function callneptunegettweets(fromnode, nodes, edges)
        {
            console.log('inside callneotunegettweets');
            console.log(fromnode);
            $.get(PROXY_API_URL + "/getusertweets?userid="+fromnode, function(data) {
                console.log(data);
                var resp = JSON.parse(JSON.stringify(data));
                console.log(resp);
                for(let i=0;i< resp.length;i++) {
                    try {
                        nodes.add({id:resp[i].id, label:resp[i].type[0] + " - " + resp[i].specific[0], value:resp[i].type[0], title: resp[i].type[0], color: 'grey'});
                    }
                    catch (e) { //if node is already added just continue
                        console.log('clicked on the same node twice');
                        console.log(e);
                    }
                }

                console.log('creating user-tweets-tweet relations');

                for(let j=0;j< resp.length;j++)
                {
                    console.log('adding edges');
                    try{
                        edges.add({id: fromnode+''+resp[j].id, from: fromnode, to: resp[j].id, label:"skilled_in", color:{color:'grey'},  arrows: {to: {enabled: true } } });
                    } //add an edge
                    catch(e)
                    {
                        console.log('clicked on the same node twice');
                    }
                }
            });
        }

        function getKnowledgeOf(fromnode, nodes, edges)
        {
            console.log("getKnowledgeOf()")
            var xhr = new XMLHttpRequest();
            var  resparr;
            const Http = new XMLHttpRequest();
            const url = PROXY_API_URL + '/neighbours?id='+fromnode;
            Http.open("GET", url);
            Http.send();
            Http.onreadystatechange = (e) =>
            {
                //console.log("getKnowledgeOf response text")
                //console.log(Http.responseText);
                //console.log(Http.readyState);
                resp = Http.responseText;
                if (Http.readyState === 4) {
                    resparr = JSON.parse(resp);
                    //console.log(resparr);
                    for(let i=0;i< resparr.length;i++) {
                        if(resparr[i].id != fromnode)
                        {
                            try {
                                nodes.add({id:resparr[i].id, label: resparr[i].industry[0] + ' - ' + resparr[i].category[0], value:resparr[i].industry});
                            }
                            catch (e) { //if node is already added just continue
                                continue;
                            }
                        }
                    }

                    console.log('printing nodes');
                    console.log(nodes);

                    for(let j=0;j< resparr.length;j++)
                    {
                        console.log('adding edges');
                        try{
                            edges.add({id: fromnode+''+resparr[j].id, from: fromnode, to: resparr[j].id, label:"knowledge_of", arrows: {to: {enabled: true } }});
                        } //add an edge
                        catch(e)
                        {
                            console.log('clicked on the same node twice');
                        }
                    }
                }
            }
        }

    </script>
   <label for="users">Find Users: </label>
    <input id="users">
    <input type="submit" id="Go" value="Go">

      </header>
    </div>
  );
}

export default App;
