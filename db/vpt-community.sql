SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

DROP SCHEMA IF EXISTS `soxnet` ;
CREATE SCHEMA IF NOT EXISTS `soxnet` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
USE `soxnet` ;

-- -----------------------------------------------------
-- Table `soxnet`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`users` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `phone_num` VARCHAR(15) NULL,
  `md5_password` VARCHAR(64) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `salt` VARCHAR(64) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `name` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NULL,
  `regd_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_time` TIMESTAMP NULL,
  `pref_starting_port` INT NOT NULL DEFAULT 5000,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soxnet`.`devices`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`devices` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`devices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id` BIGINT UNSIGNED NOT NULL,
  `device_key` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `name` VARCHAR(255) NULL,
  `secret` VARCHAR(255) CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci' NOT NULL,
  `type` ENUM('L','S','E','W') NOT NULL DEFAULT 'W',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disabled` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('C', 'D') NOT NULL DEFAULT 'D',
  `last_connection_ts` DATETIME NULL,
  `last_disconnect_ts` DATETIME NULL,
  `version` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `node_key_UNIQUE` (`device_key` ASC),
  INDEX `fk_nodes_users1_idx` (`owner_id` ASC),
  UNIQUE INDEX `node_name_uq_index` (`name` ASC, `owner_id` ASC),
  CONSTRAINT `fk_nodes_users1`
    FOREIGN KEY (`owner_id`)
    REFERENCES `soxnet`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soxnet`.`shared_devices`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`shared_devices` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`shared_devices` (
  `device_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `shared_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`device_id`, `user_id`),
  INDEX `userfk_idx` (`user_id` ASC),
  CONSTRAINT `node_users_nodefk`
    FOREIGN KEY (`device_id`)
    REFERENCES `soxnet`.`devices` (`id`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT `node_users_userfk`
    FOREIGN KEY (`user_id`)
    REFERENCES `soxnet`.`users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soxnet`.`port_maps`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`port_maps` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`port_maps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `svc_dev_id` BIGINT UNSIGNED NOT NULL,
  `svc_port` INT NOT NULL,
  `mapped_dev_id` BIGINT UNSIGNED NOT NULL,
  `mapped_port` INT NULL,
  `protocol` ENUM('TCP','UDP') NULL,
  `opened_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `app_side_status` ENUM('READY','PENDING') NOT NULL DEFAULT 'PENDING' COMMENT ' /* comment truncated */ /*Ready and Pending*/',
  `svc_side_status` ENUM('READY','PENDING') NOT NULL DEFAULT 'PENDING' COMMENT ' /* comment truncated */ /*Ready and Pending*/',
  `disabled` TINYINT(1) NOT NULL DEFAULT 0,
  `last_update_ts` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `svc_device_id_UNIQUE` (`svc_dev_id` ASC, `svc_port` ASC, `mapped_dev_id` ASC, `mapped_port` ASC),
  INDEX `fk_port_maps_devices2_idx` (`mapped_dev_id` ASC),
  CONSTRAINT `fk_port_maps_devices1`
    FOREIGN KEY (`svc_dev_id`)
    REFERENCES `soxnet`.`devices` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_port_maps_devices2`
    FOREIGN KEY (`mapped_dev_id`)
    REFERENCES `soxnet`.`devices` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soxnet`.`device_updates`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`device_updates` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`device_updates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `updateType` ENUM('portMapStatus','nodeStatus','newShareStatus','newPortMap') NOT NULL,
  `refId` BIGINT UNSIGNED NOT NULL,
  `update_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(45) NULL,
  `params` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soxnet`.`invitation_code`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`invitation_code` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`invitation_code` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(45) NULL,
  `user_limit` INT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soxnet`.`user_invitations`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `soxnet`.`user_invitations` ;

CREATE TABLE IF NOT EXISTS `soxnet`.`user_invitations` (
  `email_id` VARCHAR(200) NOT NULL,
  `invitation_code` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`email_id`, `invitation_code`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
