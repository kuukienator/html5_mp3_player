/**
 * Created by Emmanuel on 13.10.2014.
 */
$(document).ready(function() {
    this.AudioPlayer =(function(){

        function AudioPlayer(){
            this.songPointer =0;
            this.pSongPointer =-1;
            this.autoplay = false;
            this.currentSongDuration =0;
            this.loadedId3counter =0;
            this.shuffleMode = false;
            this.repeatMode = true;

            this.initialize();

        }

        AudioPlayer.prototype.initialize = function(){
            this.artHolder = $('#art');
            this.initializeDragDrop();
            this.initializeControls();
            this.initializeProgressBar();
            this.initializeAudioElement();
            this.initializeVolumeBar();

            this.showSplashScreen();

        };

        AudioPlayer.prototype.showSplashScreen = function(){
            this.artHolder.empty();
            $('<div>',{id: 'splashscreen'})
                .append($('<i>',{class:'fa fa-files-o fa-5x'}))
                .append($('<p>').html('Drag and drop music files.'))
                .appendTo(this.artHolder);
        };

        AudioPlayer.prototype.showLoadingScreen = function(){
            this.artHolder.empty();
            $('<div>',{id: 'loading'})
                .append($('<i>',{class:'fa fa-circle-o-notch fa-5x fa-spin'}))
                .appendTo(this.artHolder);
        };

        AudioPlayer.prototype.showNoSongsScreen = function(){
            this.artHolder.empty();
            $('<div>',{id: 'splashscreen'})
                .append($('<i>',{class:'fa fa-minus-circle fa-5x'}))
                .append($('<p>').html('No supported files found.'))
                .appendTo(this.artHolder);

        };

        AudioPlayer.prototype.initializeVolumeBar = function(){
            var self = this;
            this.volumebar = $('#volume-progress-bar');
            this.volumebar.width((this.audioelement.volume / 1.0) * 100 + "%");
            console.log(this.audioelement.volume / 1.0 * 100);
            $('#volume-progress').click(function(event){
                var volumePercent = event.offsetX /$(event.currentTarget).width() *100;
                self.volumebar.width(volumePercent+"%");
                self.setVolume(volumePercent);
            });
        };

        AudioPlayer.prototype.initializeAudioElement = function(){
            var self = this;
            var audio = new Audio();
            audio.controls = false;
            audio.autoplay = false;
            audio.volume = 0.5;
            audio.addEventListener('timeupdate',function(){
                var current = audio.currentTime;
                var duration = audio.duration;
                if(self.currentSongDuration===0 || isNaN(self.currentSongDuration)){
                    self.currentSongDuration = duration;
                    console.log(duration);
                    $('#totaltime').html("Total: " + self.formatTime(Math.round(duration)));
                }

                $('#progresstime').html(self.formatTime(Math.round(audio.currentTime)));

                var progress = ~~(current/duration * 10000);
                progress = progress/10000;
                self.progressbar.width(progress *100+'%');

            });

            audio.addEventListener('ended',function() {
                if (self.songPointer < self.songsList.length - 1) {
                    self.pSongPointer = self.songPointer;
                    self.songPointer++;
                    self.playSong();
                }else {
                    if (self.repeatMode) {
                        self.pSongPointer = self.songPointer;
                        self.songPointer = 0;
                        self.playSong();
                    }
                }



            });
            document.getElementById("art").appendChild(audio);
            this.audioelement = audio;
        };

        AudioPlayer.prototype.initializeDragDrop = function(){
            var self = this;
            $("#container")
                .on('dragenter',dragenter)
                .on('dragover',dragover)
                .on('drop',drop);

            function dragenter(event){
                event.stopPropagation();
                event.preventDefault();
            }

            function dragover(event){
                event.stopPropagation();
                event.preventDefault();
            }

            function drop(event){
                event.stopPropagation();
                event.preventDefault();

                self.pausePlayBack();
                self.clearPlayList();
                self.showLoadingScreen();
                self.loadedId3counter =0;
                self.songPointer =0;
                self.pSongPointer =-1;

                console.log("Dropping files");
                var dt = event.originalEvent.dataTransfer;
                var files = dt.files;

                self.filterFiles(files);

                if(self.songsList.length <=0){
                    console.log("No supported Files");
                    self.showNoSongsScreen();
                }

                if(self.autoplay){
                    self.playSong();
                }

            }
        };

        AudioPlayer.prototype.initializeControls = function(){
            var self = this;

            $("#mute").click(function(){
                console.log("Mute");
                if(self.isMuted()){
                    $('#mute').removeClass('fa-volume-off').addClass('fa-volume-up');
                    self.toggleMute();
                }else{
                    $('#mute').removeClass('fa-volume-up').addClass('fa-volume-off');
                    self.toggleMute();
                }
            });
            $("#previous").click(function(){
                console.log("Prev");
                self.pSongPointer = self.songPointer;
                self.songPointer--;
                if(self.songPointer === -1){
                    self.songPointer = self.songsList.length-1;
                }
                self.playSong();
                self.togglePlayPause();
            });
            $("#next").click(function(){
                console.log("Next");
                self.pSongPointer = self.songPointer;
                self.songPointer++;
                self.songPointer %= self.songsList.length;
                self.playSong();
                self.togglePlayPause();
            });
            $("#playpause").click(function(){
                console.log("Pause/Play");
                console.log(self.isPaused());

                if(self.isPaused()){
                    console.log("play now");
                    $('#playpause').removeClass('fa-play').addClass('fa-pause');
                    self.resumePlayBack();
                }else{
                    console.log("pause now");
                    $('#playpause').removeClass('fa-pause').addClass('fa-play');
                    self.pausePlayBack();
                }
            });

            this.loopButton =$('#loop');
            if(this.repeatMode){
                this.loopButton.removeClass('toggleinactive');
                this.loopButton.addClass('toggleactive');
            }else{
                this.loopButton.removeClass('toggleactive');
                this.loopButton.addClass('toggleinactive');
            }
            this.loopButton.click(function(){
                self.toggleLoop();
            });

            this.shuffleButton = $('#random');
            if(this.shuffleMode){
                this.shuffleButton.removeClass('toggleinactive');
                this.shuffleButton.addClass('toggleactive');
            }else{
                this.shuffleButton.removeClass('toggleactive');
                this.shuffleButton.addClass('toggleinactive');
            }
            this.shuffleButton.click(function(){
                self.toggleShuffle();
            });
        };

        AudioPlayer.prototype.toggleLoop = function(){
            this.repeatMode = !this.repeatMode;
            if(this.repeatMode){
                this.loopButton.removeClass('toggleinactive');
                this.loopButton.addClass('toggleactive');
            }else{
                this.loopButton.removeClass('toggleactive');
                this.loopButton.addClass('toggleinactive');
            }
        };

        AudioPlayer.prototype.togglePlayPause = function(){
            if(this.isPaused()){
                $('#playpause').removeClass('fa-pause').addClass('fa-play');

            }else{
                $('#playpause').removeClass('fa-play').addClass('fa-pause');
            }
        };

        AudioPlayer.prototype.toggleShuffle = function(){
            this.shuffleMode = !this.shuffleMode;
            if(this.shuffleMode){
                this.shuffleButton.removeClass('toggleinactive');
                this.shuffleButton.addClass('toggleactive');
            }else{
                this.shuffleButton.removeClass('toggleactive');
                this.shuffleButton.addClass('toggleinactive');
            }
        };

        AudioPlayer.prototype.initializeProgressBar= function(){
            var self = this;

            this.progressbar = $('#audio-progress-bar');
            this.progressbarback = $('#audio-progress');

            this.progressbarback.on('click',function(event){
               var seekPercent = event.offsetX /$(event.currentTarget).width() *100;
               self.seek(seekPercent);
            });
        };

        AudioPlayer.prototype.formatTime = function(secs){
            secs = Math.round(secs);
            var min = Math.round(secs/60);
            var sec = Math.round(secs%60);
            if(min<10){
                min = " "+min;
            }
            if(sec<10){
                sec = "0"+sec;
            }
            return min +":"+sec;
        };

        AudioPlayer.prototype.clearPlayList = function(){
            if(this.songsList){
                this.songsList.forEach(function(song){
                    if(song.dataUrl){
                        URL.revokeObjectURL(song.dataUrl);
                    }
                });

                this.songsList = [];

                $('#songlist').empty();
            }
        };

        AudioPlayer.prototype.filterFiles = function(fileList){
            console.log(fileList);
            this.songsList = [];
            var arFileList = [].slice.call(fileList);
            arFileList.sort(function(a,b){
                if(a.name > b.name){
                    return 1;
                }
                if(a.name < b.name){
                    return -1;
                }
                return 0;
            });

            if(this.shuffleMode){
                arFileList = this.fisherYatesShuffle(arFileList);
            }

            for(var i=0;i<arFileList.length;i++){
                if(arFileList[i].type === 'audio/mp3'){
                    this.addSongToPlayList(arFileList[i]);
                }
            }
        };

        AudioPlayer.prototype.fisherYatesShuffle = function(array){
            //From http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

            var currentIndex = array.length, temporaryValue, randomIndex ;
            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        };

        AudioPlayer.prototype.addSongToPlayList = function(file){
            var self = this;
            var song = {file: file,dataUrl:""};
            self.songsList.push(song);
            /*
            var songLi =  $('<li>')
                .append($('<span>',{class:"songname"}).html(file.name))
                .append($('<span>',{class:"artistname"}).html(""))
                .click(function(event){
                    console.log($(this).index());
                    console.log($(event.target).index());
                    self.pSongPointer = self.songPointer;
                    self.songPointer = $(this).index();
                    self.playSong();

                });

            songLi.appendTo($('#songlist'));
            */

            ID3.loadTags(file.name, function() {
                song.tags = ID3.getAllTags(file.name);

                //songLi.find(".songname").html(song.tags.title);
                //songLi.find(".artistname").html(song.tags.artist);

                //songLi.append($('<span>',{class:"songname"}).html(song.tags.title)).append($('<span>',{class:"artistname"}).html(song.tags.artist));
                //songLi.html(song.tags.title);
                self.loadedId3counter++;
                if(self.loadedId3counter>= self.songsList.length){
                    console.log("Done loading tags");
                    //self.renderPlaylist();
                    self.initializeCoverArt();
                }
            },
              {
                dataReader: FileAPIReader(file),
                tags: ["artist","title","year","picture"]
              }
            );
        };

        AudioPlayer.prototype.initializeCoverArt = function(){
            this.artHolder.empty();
            $('<img>',{id:'coverArt',src:this.getImageUrl(this.songsList[this.songPointer].tags.picture)}).appendTo(this.artHolder);
            $('<div>',{id:'imageOverlay'})
                .append($('<div>',{id:'imageOverlayText'})
                    .append($('<span>',{id:'overlaysongname'}).html(this.songsList[this.songPointer].tags.title))
                    .append($('<span>',{id:'overlayartist'}).html(this.songsList[this.songPointer].tags.artist))
                )
                .appendTo(this.artHolder);

        };

        AudioPlayer.prototype.renderCoverArt = function(song){
            $('#coverArt').attr('src',this.getImageUrl(song.tags.picture));
            $('#overlaysongname').html(song.tags.title);
            $('#overlayartist').html(song.tags.artist);

        };

        AudioPlayer.prototype.renderPlaylist = function(){
            var self = this;
            console.log(this.songsList);

            this.artHolder.empty();
            $('<div>')
                .append($('<ul>',{id:'songlist'}))
                .appendTo(this.artHolder);

            this.songsList.forEach(function(item){
                var songLi =  $('<li>')
                    .append($('<div>',{class:'playlistitem'})
                        .append($('<img>',{class:'playlistcover',src:self.getImageUrl(item.tags.picture)}))
                        .append($('<div>',{class:'playlisttext'})
                            .append($('<span>',{class:"songname"}).html(item.tags.title))
                            .append($('<span>',{class:"artistname"}).html(item.tags.artist))
                        )
                    )
                    .click(function(event){
                        console.log($(this).index());
                        console.log($(event.target).index());
                        self.pSongPointer = self.songPointer;
                        self.songPointer = $(this).index();
                        self.playSong();

                    });

                songLi.appendTo($('#songlist'));
            });


        };

        AudioPlayer.prototype.playSong = function(){
            console.log("PLAY");
            this.reset();
            var song = this.songsList[ this.songPointer];
            this.renderCoverArt(song);


            if(song.dataUrl){
                this.audioelement.src = song.dataUrl;
                this.audioelement.play();
            }else{
                song.dataUrl = URL.createObjectURL(song.file);
                this.audioelement.src = song.dataUrl;
                this.audioelement.play();
            }
            /*
            $('#currentsong').html(song.file.name);
            var songlist =$('#songlist');
            $(songlist.find('li').get(this.pSongPointer)).removeClass("li-active");
            var currentSong = $(songlist.find('li').get(this.songPointer)).addClass("li-active");
            songlist.scrollTop(currentSong.offset().top - songlist.offset().top + songlist.scrollTop());
            */

            //this.albumArt.src = this.getImageUrl(song.tags.picture);

            document.title = song.file.name;

        };

        AudioPlayer.prototype.getImageUrl = function(picture){
            if(!picture){
                return "images/cover.png";
            }
            var base64String = "";
            for (var i = 0; i < picture.data.length; i++) {
                base64String += String.fromCharCode(picture.data[i]);
            }
            return "data:" + picture.format + ";base64," + window.btoa(base64String);
        };

        AudioPlayer.prototype.pausePlayBack = function(){
            this.audioelement.pause();
        };

        AudioPlayer.prototype.resumePlayBack = function () {
            if(this.audioelement.readyState ===0){
                this.playSong();
            }else{
                this.audioelement.play();
            }

        };

        AudioPlayer.prototype.isPaused =  function(){
            if(this.audioelement){
                return this.audioelement.paused;
            }else{
                return false;
            }
        };

        AudioPlayer.prototype.isMuted =  function(){

            if(this.audioelement !== undefined){
                console.log("exists");
                return this.audioelement.muted;
            }else{
                return false;
            }
        };

        AudioPlayer.prototype.setVolume = function(percent){
            if(this.audioelement){
                this.audioelement.volume = 1.0 * (percent/100);
                console.log(this.audioelement.volume);
            }

        };

        AudioPlayer.prototype.toggleMute = function(){
            this.audioelement.muted = !this.audioelement.muted;
        };

        AudioPlayer.prototype.reset = function () {
            this.currentSongDuration =0;
            this.progressbar.width(0);
        };

        AudioPlayer.prototype.seek = function(percent){
          if(this.audioelement){
            this.audioelement.currentTime = this.currentSongDuration * percent/100;
          }
        };

        return AudioPlayer;
    })();

    new this.AudioPlayer();

});


