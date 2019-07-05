

// Widget class from which all the widgets inherits common functionalities
class Widget {
    constructor(id, widget) {
        // keep track html id and widget content
        this.id = id.replaceAll("/","_")
        this.widget = widget
    }
    
    // draw the widget (subclass has to implement)
    draw() {
        throw new Error('draw() not implemented')
    }
    
    // close the widget (subclass has to implement)
    close() {
        throw new Error('close() not implemented')
    }
    
    // load data into the widget (subclass has to implement)
    on_message(message) {
        throw new Error('on_message() not implemented')
    }
    
    // pass configuration into the widget (subclass has to implement)
    on_configuration(message) {
        throw new Error('on_configuration() not implemented')
    }
    
    // wrap gui.add_inspection_listener()
    add_inspection_listener(from_module, to_module, command, args) {
        var request = command+"/"+args
        // whenever there will be a message matching this request, the widget will be notified
        if (request in gui.listeners && ! gui.listeners[request].includes(this)) gui.listeners[request].push(this)
        else gui.listeners[request] = [this]
        var topic = gui.add_inspection_listener(from_module, to_module, command, args)
        // keep track of the topic subscribed
        gui.topics.push(topic)
        return topic
    }
    
    // wrap gui.add_broadcast_listener()
    add_broadcast_listener(from_module, command, args) {
        return this.add_inspection_listener(from_module, "*/*", command, args)
    }
    
    // wrap gui.add_configuration_listener()
    add_configuration_listener(configuration) {
        // if the requested configuration was already received, pass it along to the widget
        for (var item in gui.configurations) {
            if (topic_matches_sub(configuration, item)) {
                var message = new Message(gui)
                message.args = item
                message.set_data(gui.configurations[item])
                this.on_configuration(message)
            }
        }
        // TODO: this is in common with the previous
        // add this widget to the array of requests or create the array if needed
        if (configuration in gui.listeners && ! gui.listeners[configuration].includes(this)) gui.listeners[configuration].push(this)
        else gui.listeners[configuration] = [this]
        // subscribe to the requested configuration
        var topic = gui.add_configuration_listener(configuration)
        gui.topics.push(topic)
        return topic
    }
    
    // remove this object from the queue of listeners for the given configuration without unsubscribing the topic
    remove_configuration_listener(configuration) {
        if (! (configuration in gui.listeners)) return
        var index = gui.listeners[configuration].indexOf(this)
        if (index > -1) gui.listeners[configuration].splice(index, 1)
    }
    
    // wrap gui.send() keeping track of the requesting widget
    send(message) {
        var request_id = message.get_request_id()
        // map the request with this widget
        gui.requests[request_id] = this
        // send the message
        gui.send(message)
    }
    
    // add a large box
    add_large_box(id, title) {
        var template = '\
            <div class="box box-primary" id="'+id+'_box">\
                <div class="box-header with-border">\
                    <h3 class="box-title" id="'+id+'_title">'+title+'</h3>\
                    <div class="box-tools pull-right" id="'+id+'_box_buttons">\
                        <button id="'+id+'_refresh" type="button" class="btn btn-box-tool"><i class="fas fa-sync"></i></button>\
                        <button id="'+id+'_popup" type="button" class="btn btn-box-tool" ><i class="fas fa-arrows-alt"></i></button>\
                    </div>\
                </div>\
                <div class="box-body no-padding box-primary">\
                    <div class="box-body" id="'+id+'_body" align="center">\
                    </div>\
                </div>\
                <div class="overlay hidden" id="'+id+'_loading">\
                    <i class="fas fa-refresh fa-spin"></i>\
                </div>\
            </div>'
        $("#"+id).empty()
        $("#"+id).html(template)
        if (id.includes("popup_body")) $("#"+id+"_box_buttons").addClass("hidden")
    }

    // add an info box
    add_small_box(id, title, icon, color) {
        var template = '<div class="info-box">\
            <span class="info-box-icon bg-'+color+'" id="'+id+'_color"><i class="fas fa-'+icon+'" id="'+id+'_icon"></i></span>\
            <div class="info-box-content">\
              <span class="info-box-text">'+title+'</span>\
              <span class="info-box-number">\
                <span id="'+id+'_value"></span>\
                <span id="'+id+'_value_suffix"></span>\
              </span>\
              <div class="text-muted" id="'+id+'_timestamp">&nbsp;</div>\
            </div>\
        </div>'
        $("#"+id).empty()
        $("#"+id).html(template)
    }
    
    // add a stat box
    add_small_box_2(id, title, icon, color, link=null) {
        var template = '<div class="small-box bg-'+color+'" id="'+id+'_color">\
            <div class="inner">\
              <h3 >\
                <span id="'+id+'_value">&nbsp;</span>\
                <span id="'+id+'_value_suffix"></span>\
              </h3>\
              <p>'+title+'</p>\
            </div>\
            <div class="icon">\
              <i class="fas fa-'+icon+'" id="'+id+'_icon"></i>\
            </div>\
            <a class="small-box-footer" id="'+id+'_link"> Show More <i class="fa fa-arrow-circle-right"></i></a>\
          </div>'
        $("#"+id).empty()
        $("#"+id).html(template)
        if (link != null) $("#"+id+"_link").attr("href", "#"+link)
        else $("#"+id+"_link").addClass("hidden")
    }
    
    // add chat box
    add_chat_box(id, title) {
        var template = '\
          <div class="box box-primary direct-chat direct-chat-primary">\
            <div class="box-header with-border">\
              <h3 class="box-title">'+title+'</h3>\
              <div class="box-tools pull-right">\
                <button type="button" id="'+id+'_eraser" class="btn btn-box-tool"><i class="fas fa-eraser"></i></button>\
                <button type="button" id="'+id+'_popup" class="btn btn-box-tool"><i class="fas fa-arrows-alt"></i></button>\
              </div>\
            </div>\
            <div class="box-body">\
              <div class="direct-chat-messages" id="'+id+'_messages">\
              </div>\
            </div>\
            <div class="box-footer">\
              <form>\
                <div class="input-group">\
                  <input type="text" name="message" placeholder="Type Message ..." class="form-control" id="'+id+'_text">\
                      <span class="input-group-btn">\
                        <button type="button" class="btn btn-primary btn-flat" id="'+id+'_button">Send</button>\
                      </span>\
                </div>\
              </form>\
            </div>\
          </div>\
        '
        $("#"+id).empty()
        $("#"+id).html(template)
        $("#"+id+"_eraser").unbind().click(function(id) {
            return function () {
                $("#"+id+"_messages").empty()  
            };
        }(id));
    }
}