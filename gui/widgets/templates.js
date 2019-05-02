// widget HTML templates
class Templates {
    // add a box template
    add_large_widget(id, title) {
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

    // add an info template
    add_small_widget(id, title, icon, color) {
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
    
    // add chat template
    add_chat_widget(id, title) {
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